import { Hono } from 'hono';
import type { Env } from '../index';
import { ConfirmBuildRequest, ConfirmBuildResponse } from '../types/world';
import {
  confirmPendingBuildToken,
  validateClientDateKey,
  validateUserId,
} from '../services/buildQuota';

export const confirmBuildRoute = new Hono<{ Bindings: Env }>();

confirmBuildRoute.post('/confirm-build', async (c) => {
  const body = await c.req.json<Partial<ConfirmBuildRequest>>().catch(() => null);
  if (!body || !body.userId || !body.clientDateKey || !body.pendingBuildToken) {
    return c.json({ error: 'Missing required fields: userId, clientDateKey, pendingBuildToken' }, 400);
  }

  if (!validateUserId(body.userId)) {
    return c.json({ error: 'Invalid userId' }, 400);
  }

  if (!validateClientDateKey(body.clientDateKey)) {
    return c.json({ error: 'Invalid clientDateKey, expected YYYY-MM-DD' }, 400);
  }

  const result = await confirmPendingBuildToken(
    c.env.WORLD_KV,
    body.userId,
    body.clientDateKey,
    body.pendingBuildToken,
  );

  if (result.status === 'invalid_token' || result.status === 'invalid_owner') {
    return c.json(
      {
        error: 'Invalid pendingBuildToken for user/date',
        quota: result.quota,
      },
      400,
    );
  }

  const response: ConfirmBuildResponse = {
    success: true,
    tokenStatus: result.status === 'accepted' ? 'accepted' : 'already_confirmed',
    quota: result.quota,
  };

  return c.json(response);
});
