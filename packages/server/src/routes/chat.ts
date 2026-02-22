import { Hono } from 'hono';
import type { Env } from '../index';
import { ChatRequest, ChatResponse } from '../types/world';
import { callLlm } from '../services/llm';
import { buildSystemPrompt } from '../services/promptBuilder';
import { parseLlmResponse, validateAction } from '../services/actionValidator';

export const chatRoute = new Hono<{ Bindings: Env }>();

chatRoute.post('/chat', async (c) => {
  const body = await c.req.json<Partial<ChatRequest>>().catch(() => null);

  if (!body || !body.agentId || !body.message || !body.worldContext) {
    return c.json({ error: 'Missing required fields: agentId, message, worldContext' }, 400);
  }

  const { agentId, message, worldContext, history = [] } = body as ChatRequest;

  if (!worldContext.userId || !worldContext.agentName) {
    return c.json({ error: 'worldContext must include userId and agentName' }, 400);
  }

  const apiKey = c.env.OPENROUTER_API_KEY;
  const model = c.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat';

  try {
    const systemPrompt = buildSystemPrompt({ ...worldContext, agentId });
    const llmResult = await callLlm(apiKey, model, systemPrompt, history, message);
    const { reply: rawReply, action: rawAction } = parseLlmResponse(llmResult.rawContent);

    const validation = validateAction(rawAction, worldContext);

    const response: ChatResponse = {
      reply: validation.overrideReply ?? rawReply,
      action: validation.action,
    };

    return c.json(response);
  } catch (error) {
    const isAbortError = error instanceof Error && error.name === 'AbortError';
    const errorMessage = isAbortError
      ? 'LLM request timed out'
      : (error instanceof Error ? error.message : 'Unknown error');

    console.error('[chat] error:', errorMessage);

    const fallbackResponse: ChatResponse = {
      reply: '抱歉，我现在有点忙，待会再聊吧~ (Sorry, I\'m a bit busy right now, let\'s chat later!)',
      action: null,
    };
    return c.json(fallbackResponse);
  }
});
