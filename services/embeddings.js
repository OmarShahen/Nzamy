const { openai } = require("../lib/openai");

const generateImageDescriptionService = async (imageUrl) => {
  const description = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this product in 2-3 keywords for search. Focus on color, type, and main features.",
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 50,
  });

  return description.choices[0].message.content;
};

const generateTextEmbeddingService = async (text) => {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return embedding.data[0].embedding;
};

const generateImageEmbeddingsService = async (images) => {
  const embeddings = await Promise.all(
    images.map(async (imageUrl) => {
      const description = await generateImageDescriptionService(imageUrl);
      const vector = await generateTextEmbeddingService(description);

      return {
        url: imageUrl,
        description,
        vector,
      };
    })
  );

  return embeddings;
};

const searchImageByDescriptionService = async (imageUrl) => {
  const description = await generateImageDescriptionService(imageUrl);
  const vector = await generateTextEmbeddingService(description);

  return {
    description,
    vector,
  };
};

module.exports = {
  generateImageDescriptionService,
  generateTextEmbeddingService,
  generateImageEmbeddingsService,
  searchImageByDescriptionService,
};
