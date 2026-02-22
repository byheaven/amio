import { Router, Request, Response } from 'express';
import { ChatRequest, ChatResponse } from '../types/world';
import { callLlm } from '../services/llm';
import { buildSystemPrompt } from '../services/promptBuilder';
import { parseLlmResponse, validateAction } from '../services/actionValidator';

export const chatRouter = Router();

chatRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<ChatRequest>;

  if (!body.agentId || !body.message || !body.worldContext) {
    res.status(400).json({ error: 'Missing required fields: agentId, message, worldContext' });
    return;
  }

  const { agentId, message, worldContext, history = [] } = body as ChatRequest;

  // Validate worldContext has required fields
  if (!worldContext.userId || !worldContext.agentName) {
    res.status(400).json({ error: 'worldContext must include userId and agentName' });
    return;
  }

  try {
    const systemPrompt = buildSystemPrompt({ ...worldContext, agentId });
    const llmResult = await callLlm(systemPrompt, history, message);
    const { reply: rawReply, action: rawAction } = parseLlmResponse(llmResult.rawContent);

    const validation = validateAction(rawAction, worldContext);

    const response: ChatResponse = {
      reply: validation.overrideReply ?? rawReply,
      action: validation.action,
    };

    res.json(response);
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
    res.json(fallbackResponse);
  }
});
