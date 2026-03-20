import { logger } from '../utils';

export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  error?: {
    message: string;
  };
}

export class GeminiService {
  private apiKey: string;
  private model: string = 'gemini-flash-latest'; // High quota Flash model

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('GEMINI_API_KEY not found in environment variables.');
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Missing Gemini API Key');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = (await response.json()) as GeminiResponse;

    if (data.error) {
      throw new Error(`Gemini API Error: ${data.error.message}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No content returned from Gemini');
    }

    return text.trim();
  }
}
