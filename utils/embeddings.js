const { openai } = require("../lib/openai");

const generateImageEmbeddings = async (imageURL) => {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: imageURL,
  });

  return { url: imageURL, vector: embedding.data[0].embedding };
};

module.exports = { generateImageEmbeddings };
