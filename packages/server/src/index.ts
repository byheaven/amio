import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { chatRoute } from './routes/chat';
import { confirmBuildRoute } from './routes/confirmBuild';
import { worldRoute } from './routes/world';

export type Env = {
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL: string;
  WORLD_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors());

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api', chatRoute);
app.route('/api', confirmBuildRoute);
app.route('/api', worldRoute);

export default app;
