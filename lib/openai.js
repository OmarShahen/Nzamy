const OpenAI = require("openai");
const config = require("../config/config");

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEYS });

module.exports = { openai };
