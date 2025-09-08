const { openai } = require("../lib/openai");
const config = require("../config/config");
const { generateStoreInstructions } = require("../utils/instructions");
const StoreModel = require("../models/StoreModel");
const runToolsFunction = require("../agents/tools/run-tools-functions");
const CategoryModel = require("../models/CategoryModel");

async function ensureNoActiveRuns(threadId) {
  try {
    // Get all runs for the thread
    const runs = await openai.beta.threads.runs.list(threadId);

    // Check for active runs (in_progress, queued, requires_action)
    const activeRuns = runs.data.filter((run) =>
      ["in_progress", "queued", "requires_action"].includes(run.status)
    );

    // Wait for active runs to complete or cancel them
    for (const run of activeRuns) {
      console.log(
        `Found active run ${run.id} with status ${run.status}, waiting for completion...`
      );

      // Immediately cancel active run for new message
      console.log(`Canceling active run ${run.id} to process new message`);
      try {
        await openai.beta.threads.runs.cancel(threadId, run.id);

        // Wait a moment for cancellation to take effect
        let cancelWaitTime = 0;
        const maxCancelWait = 5000; // 5 seconds

        while (cancelWaitTime < maxCancelWait) {
          const updatedRun = await openai.beta.threads.runs.retrieve(
            threadId,
            run.id
          );

          if (
            ["cancelled", "failed", "completed"].includes(updatedRun.status)
          ) {
            console.log(
              `Run ${run.id} cancelled with status ${updatedRun.status}`
            );
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
          cancelWaitTime += 500;
        }
      } catch (cancelError) {
        console.error(`Failed to cancel run ${run.id}:`, cancelError);
      }
    }
  } catch (error) {
    console.error("Error ensuring no active runs:", error);
    // Continue anyway - the original error might still occur but we tried our best
  }
}

const askService = async (askData) => {
  let { message, threadId, storeId, senderId } = askData;

  const store = await StoreModel.findById(storeId);
  if (!store) {
    throw new Error("store Id is not registered");
  }

  if (!threadId) {
    const thread = await openai.beta.threads.create();
    threadId = thread.id;
  }

  // Check for active runs before adding message
  await ensureNoActiveRuns(threadId);

  const messageObjData = { role: "user", content: message };
  await openai.beta.threads.messages.create(threadId, messageObjData);

  const categories = await CategoryModel.find({ storeId });

  store.senderId = senderId;
  const storeInstructions = generateStoreInstructions(store, categories);

  const runData = {
    assistant_id: config.OPENAI_ASSISTANT_ID,
    instructions: storeInstructions,
  };
  const run = await openai.beta.threads.runs.create(threadId, runData);
  let runStatus = run.status;
  let finalRun = run;

  while (runStatus != "completed" && runStatus != "failed") {
    if (
      runStatus == "requires_action" &&
      finalRun.required_action?.type == "submit_tool_outputs"
    ) {
      const toolCalls = finalRun.required_action.submit_tool_outputs.tool_calls;

      const toolResponses = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const output = await runToolsFunction(toolCall);
          return { tool_call_id: toolCall.id, output };
        })
      );

      finalRun = await openai.beta.threads.runs.submitToolOutputs(finalRun.id, {
        thread_id: threadId,
        tool_outputs: toolResponses,
      });

      runStatus = finalRun.status;
    } else {
      await new Promise((res) => setTimeout(res, 1000));
      finalRun = await openai.beta.threads.runs.retrieve(finalRun.id, {
        thread_id: threadId,
      });
      runStatus = finalRun.status;
    }
  }

  let lastMessage;
  if (finalRun.status == "completed") {
    const messages = await openai.beta.threads.messages.list(
      finalRun.thread_id
    );
    const lastMessageList = messages.data.find(
      (message) => message.role == "assistant"
    );

    lastMessage = lastMessageList.content[0]?.text?.value;
  } else if (finalRun.status == "failed") {
    lastMessage = "there was a problem";
  } else {
    console.log(finalRun.status);
  }

  const usage = {
    userTokens: finalRun.usage.prompt_tokens,
    botTokens: finalRun.usage.completion_tokens,
    totalTokens: finalRun.usage.total_tokens,
  };

  return { threadId, message: lastMessage, usage };
};

module.exports = { askService };
