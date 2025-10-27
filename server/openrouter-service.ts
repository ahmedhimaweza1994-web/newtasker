import type { Response } from 'express';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stream?: boolean;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string | null;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://localhost',
      'X-Title': 'GWT AI System',
    };
  }

  async listModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error listing OpenRouter models:', error);
      throw error;
    }
  }

  async chat(request: OpenRouterRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error?.message || errorData.error || response.statusText);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in OpenRouter chat:', error);
      throw error;
    }
  }

  async streamChat(
    request: OpenRouterRequest,
    res: Response,
    onToken?: (token: string) => void
  ): Promise<{ promptTokens: number; completionTokens: number; totalTokens: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error?.message || errorData.error || response.statusText);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let promptTokens = 0;
      let completionTokens = 0;
      let totalTokens = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') {
              continue;
            }

            if (trimmedLine.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(trimmedLine.slice(6));
                
                if (jsonData.usage) {
                  promptTokens = jsonData.usage.prompt_tokens || 0;
                  completionTokens = jsonData.usage.completion_tokens || 0;
                  totalTokens = jsonData.usage.total_tokens || 0;
                }

                if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                  const content = jsonData.choices[0].delta.content;
                  fullContent += content;
                  
                  if (onToken) {
                    onToken(content);
                  }
                  
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();

        return { promptTokens, completionTokens, totalTokens };
      } catch (streamError) {
        console.error('Error during streaming:', streamError);
        throw streamError;
      }
    } catch (error) {
      console.error('Error in OpenRouter stream chat:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }
}

export function getOpenRouterService(apiKey?: string): OpenRouterService {
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  return new OpenRouterService(key);
}
