import { Router, Request, Response } from 'express';
import { MongoClient, Db } from 'mongodb';
import { WorldStateJSON } from '../types/world';

export const worldRouter = Router();

const DEFAULT_WORLD_ID = 'default';

let dbClient: MongoClient | null = null;
let db: Db | null = null;

const getDb = async (): Promise<Db> => {
  if (db) {
    return db;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  dbClient = new MongoClient(mongoUri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  });
  await dbClient.connect();
  db = dbClient.db();
  console.log('[world] MongoDB connected');
  return db;
};

worldRouter.post('/save-world', async (req: Request, res: Response): Promise<void> => {
  const worldState = req.body as Partial<WorldStateJSON>;

  if (!worldState || worldState.version !== 1) {
    res.status(400).json({ error: 'Invalid world state format' });
    return;
  }

  try {
    const database = await getDb();
    const collection = database.collection('worlds');

    await collection.updateOne(
      { worldId: DEFAULT_WORLD_ID },
      {
        $set: {
          worldId: DEFAULT_WORLD_ID,
          ...worldState,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[world] save error:', message);
    res.status(500).json({ error: 'Failed to save world state' });
  }
});

worldRouter.get('/load-world', async (_req: Request, res: Response): Promise<void> => {
  try {
    const database = await getDb();
    const collection = database.collection('worlds');

    const doc = await collection.findOne(
      { worldId: DEFAULT_WORLD_ID },
      { projection: { _id: 0, worldId: 0, updatedAt: 0 } },
    );

    if (!doc) {
      res.json({ worldState: null });
      return;
    }

    res.json({ worldState: doc as unknown as WorldStateJSON });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[world] load error:', message);
    res.status(500).json({ error: 'Failed to load world state' });
  }
});
