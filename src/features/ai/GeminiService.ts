const GEMINI_MODEL = 'gemini-1.5-flash';

type GeminiMessage = {
  role: 'user' | 'model';
  text: string;
};

export class GeminiService {
  private readonly apiKey: string;
  private readonly systemPrompt: string;

  constructor(apiKey: string, systemPrompt: string) {
    if (!apiKey) {
      throw new Error('Missing VITE_GEMINI_API_KEY. Please set it in your environment.');
    }

    this.apiKey = apiKey;
    this.systemPrompt = systemPrompt;
  }

  async generateReply(history: GeminiMessage[], userText: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

    const contents = [
      ...history.map((item) => ({
        role: item.role,
        parts: [{ text: item.text }],
      })),
      { role: 'user', parts: [{ text: userText }] },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: this.systemPrompt }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 120,
        },
        contents,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini returned empty response.');
    }

    return text.trim();
  }
}

export type { GeminiMessage };
