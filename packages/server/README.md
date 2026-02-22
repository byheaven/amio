# AMIO 3D World Server

Backend API server for the AMIO 3D World (Sprint 3: AI Dialog Building).

## Setup

```bash
cp .env.example .env
# Edit .env with your API keys
npm install
```

## Development

```bash
npm run dev
# Server starts at http://localhost:3001
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-...` |
| `OPENROUTER_MODEL` | Model to use | `deepseek/deepseek-chat` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/amio` |
| `PORT` | Server port | `3001` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:10086` |

## API Endpoints

### `POST /api/chat`

Send a user message to an AI agent and receive a reply with optional action.

```json
// Request
{
  "agentId": "agent-1",
  "message": "Build a monument called Four-Dollar Racket Monument",
  "worldContext": { ... },
  "history": [...]
}

// Response
{
  "reply": "Great name! I'll start building right away.",
  "action": {
    "type": "build",
    "buildingType": "monument",
    "name": "Four-Dollar Racket Monument",
    "near": "agent"
  }
}
```

### `POST /api/save-world`

Persist current world state to MongoDB.

### `GET /api/load-world`

Load the latest world state from MongoDB.

## Dev Proxy

When running `npm run dev:h5` in `amio-app/`, API calls to `/api/*` are proxied to `http://localhost:3001` automatically (configured in `config/dev.ts`).
