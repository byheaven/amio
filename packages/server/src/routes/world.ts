import { Hono } from 'hono';
import type { Env } from '../index';
import { WorldStateJSON } from '../types/world';

export const worldRoute = new Hono<{ Bindings: Env }>();

const WORLD_KV_KEY = 'world:default';

worldRoute.post('/save-world', async (c) => {
  const body = await c.req.json<Partial<WorldStateJSON>>().catch(() => null);

  if (!body || body.version !== 1) {
    return c.json({ error: 'Invalid world state format' }, 400);
  }

  await c.env.WORLD_KV.put(WORLD_KV_KEY, JSON.stringify(body));
  return c.json({ success: true });
});

worldRoute.get('/load-world', async (c) => {
  const raw = await c.env.WORLD_KV.get(WORLD_KV_KEY);
  const worldState = raw ? JSON.parse(raw) as WorldStateJSON : null;
  return c.json({ worldState });
});
