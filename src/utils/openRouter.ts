import axios from "axios";

export interface OpenRouterRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  model?: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callOpenRouter(prompt: string, options: {
  max_tokens?: number;
  temperature?: number;
  model?: string;
} = {}): Promise<string> {
  const {
    max_tokens = 1000,
    temperature = 0.7,
    model = 'deepseek/deepseek-r1:free'
  } = options;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens,
      temperature
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw new Error('Failed to call OpenRouter API');
  }
}
