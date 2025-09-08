const cosineSimilarity = require("./cosine-similarity");

function scoreItems(items, queryVector) {
  const scored = [];

  for (const item of items) {
    for (const img of item.images) {
      if (img.vector && img.vector.length) {
        const score = cosineSimilarity(queryVector, img.vector);
        scored.push({
          ...item._doc,
          images: undefined,
          imageUrl: img.url,
          score,
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored;
}

module.exports = { scoreItems };
