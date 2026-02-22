import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat';
import { worldRouter } from './routes/world';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:10086';

app.use(cors({
  origin: [clientOrigin, 'http://localhost:10086', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', chatRouter);
app.use('/api', worldRouter);

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
