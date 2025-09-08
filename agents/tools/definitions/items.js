const searchItemsDefinition = {
  name: "searchItems",
  description: "Search store items by name for a specific store",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      storeId: { type: "string", description: "The store ID to search within" },
      nameQuery: {
        type: "string",
        description: "The keyword to search items by name",
      },
    },
    required: ["storeId", "nameQuery"],
    additionalProperties: false,
  },
};
