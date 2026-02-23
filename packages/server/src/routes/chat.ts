import { Hono } from 'hono';
import type { Env } from '../index';
import { ChatMessage, ChatRequest, ChatResponse } from '../types/world';
import { callLlm } from '../services/llm';
import { buildSystemPrompt } from '../services/promptBuilder';
import { parseLlmResponse, validateAction } from '../services/actionValidator';
import {
  createPendingBuildToken,
  getDailyBuildUsage,
  quotaFromUsage,
  validateClientDateKey,
  validateUserId,
} from '../services/buildQuota';

export const chatRoute = new Hono<{ Bindings: Env }>();

const MAX_HISTORY_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 500;
const MAX_HISTORY_TOTAL_CHARS = 4000;

const sanitizeContent = (content: string): string => content.trim().slice(0, MAX_MESSAGE_CHARS);

const sanitizeHistory = (inputHistory: unknown): ChatMessage[] => {
  if (!Array.isArray(inputHistory)) {
    return [];
  }

  const normalized: ChatMessage[] = [];
  inputHistory.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const maybeRole = (entry as { role?: unknown }).role;
    const maybeContent = (entry as { content?: unknown }).content;
    if ((maybeRole !== 'user' && maybeRole !== 'assistant') || typeof maybeContent !== 'string') {
      return;
    }

    const content = sanitizeContent(maybeContent);
    if (!content) {
      return;
    }

    normalized.push({ role: maybeRole, content });
  });

  const recentMessages = normalized.slice(-MAX_HISTORY_MESSAGES);
  const keptMessages: ChatMessage[] = [];
  let totalChars = 0;

  for (let index = recentMessages.length - 1; index >= 0; index -= 1) {
    const message = recentMessages[index];
    const nextTotal = totalChars + message.content.length;
    if (nextTotal > MAX_HISTORY_TOTAL_CHARS) {
      continue;
    }
    keptMessages.push(message);
    totalChars = nextTotal;
  }

  return keptMessages.reverse();
};

chatRoute.post('/chat', async (c) => {
  const body = await c.req.json<Partial<ChatRequest>>().catch(() => null);

  if (
    !body
    || !body.agentId
    || !body.worldContext
    || !body.userId
    || !body.clientDateKey
  ) {
    return c.json({ error: 'Missing required fields: agentId, message, userId, clientDateKey, worldContext' }, 400);
  }

  if (!validateUserId(body.userId)) {
    return c.json({ error: 'Invalid userId' }, 400);
  }

  if (!validateClientDateKey(body.clientDateKey)) {
    return c.json({ error: 'Invalid clientDateKey, expected YYYY-MM-DD' }, 400);
  }

  const userId = body.userId;
  const clientDateKey = body.clientDateKey;
  const message = sanitizeContent(typeof body.message === 'string' ? body.message : '');
  if (!message) {
    return c.json({ error: 'message is required' }, 400);
  }

  const { agentId, worldContext } = body as ChatRequest;
  const history = sanitizeHistory(body.history);

  if (!worldContext.agentName) {
    return c.json({ error: 'worldContext must include agentName' }, 400);
  }

  const apiKey = c.env.OPENROUTER_API_KEY;
  const model = c.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat';
  const dailyUsage = await getDailyBuildUsage(c.env.WORLD_KV, userId, clientDateKey);
  const worldContextWithQuota = {
    ...worldContext,
    agentId,
    userId,
    userDailyBuildCount: dailyUsage,
  };
  const baseQuota = quotaFromUsage(dailyUsage);

  try {
    const systemPrompt = buildSystemPrompt(worldContextWithQuota);
    const llmResult = await callLlm(apiKey, model, systemPrompt, history, message);
    const { reply: rawReply, action: rawAction } = parseLlmResponse(llmResult.rawContent);

    const validation = validateAction(rawAction, worldContextWithQuota);
    let responseQuota = baseQuota;
    if (validation.action?.type === 'build') {
      const pendingBuildToken = await createPendingBuildToken(c.env.WORLD_KV, userId, clientDateKey);
      responseQuota = quotaFromUsage(dailyUsage, pendingBuildToken);
    }

    const response: ChatResponse = {
      reply: validation.overrideReply ?? rawReply,
      action: validation.action,
      quota: responseQuota,
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
      quota: baseQuota,
    };
    return c.json(fallbackResponse);
  }
});
