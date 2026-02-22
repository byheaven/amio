import { ChatMessage } from '../types/world';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_TIMEOUT_MS = 10000;

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  reply: string;
  rawContent: string;
}

const buildMessages = (
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
): LlmMessage[] => {
  const messages: LlmMessage[] = [{ role: 'system', content: systemPrompt }];

  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: userMessage });
  return messages;
};

export const callLlm = async (
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
): Promise<LlmResponse> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const model = process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat';
  const messages = buildMessages(systemPrompt, history, userMessage);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://amio.app',
        'X-Title': 'AMIO 3D World',
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 512,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawContent = data.choices?.[0]?.message?.content ?? '';
  return { reply: rawContent, rawContent };
};
