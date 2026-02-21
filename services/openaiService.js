const OpenAI = require('openai');
const { SYSTEM_PROMPT } = require('../config/systemPrompt');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate persuasive sales response from user speech.
 * @param {string} userText - The transcribed caller text.
 * @returns {Promise<string>} Sales response text.
 */
async function generateSalesResponse(userText) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  if (!userText || !userText.trim()) {
    throw new Error('Cannot generate response from empty transcript.');
  }

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Caller said: "${userText.trim()}"\nRespond as the sales agent.`
      }
    ]
  });

  const message = completion.choices?.[0]?.message?.content;
  if (!message) {
    throw new Error('OpenAI returned an empty response.');
  }

  return message.trim();
}

module.exports = {
  generateSalesResponse
};
