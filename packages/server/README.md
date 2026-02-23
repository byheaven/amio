# AMIO 3D World Server

Backend API for the AMIO 3D World — runs on **Cloudflare Workers** with **Hono** framework and **Cloudflare KV** for persistence.

## Why Cloudflare Workers

- Completely free (100K requests/day)
- Global CDN edge deployment
- No server management
- Secrets stored in Cloudflare (never in code or git)

## Prerequisites

```bash
npm install -g wrangler
wrangler login   # authenticate with your Cloudflare account
```

## First-Time Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the KV namespace

```bash
# Production namespace
wrangler kv namespace create WORLD_KV
# Preview namespace (for wrangler dev)
wrangler kv namespace create WORLD_KV --preview
```

Copy the `id` values into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "WORLD_KV"
id = "<production-id-from-above>"
preview_id = "<preview-id-from-above>"
```

### 3. Set the API key secret

```bash
wrangler secret put OPENROUTER_API_KEY
# Enter your key when prompted — it is stored encrypted in Cloudflare, never in code
```

### 4. Configure local dev secrets

```bash
cp .dev.vars.example .dev.vars   # or create manually
# Edit .dev.vars and add your key:
# OPENROUTER_API_KEY=sk-or-v1-...
```

`.dev.vars` is git-ignored and only read by `wrangler dev` locally.

## Development

```bash
npm run dev
# Worker starts at http://localhost:8787
# Proxied from amio-app dev server via config/dev.ts
```

## Deployment (Automated via GitHub Actions)

Push to `main` — GitHub Actions automatically:
1. Deploys the Worker to `api.amio.love`
2. Builds the frontend with `TARO_APP_API_URL=https://api.amio.love`
3. Deploys the frontend to `game.amio.love`

**Required GitHub Secrets** (set in repo Settings → Secrets → Actions):

| Secret | How to get it |
|--------|--------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens → Create Token (Workers permissions) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → right sidebar on any page |
| `OPENROUTER_API_KEY` | OpenRouter Dashboard |

**One-time manual setup** (only needed on first deploy):

```bash
# 1. Create KV namespace
wrangler kv namespace create WORLD_KV
wrangler kv namespace create WORLD_KV --preview
# Paste the ids into wrangler.toml

# 2. The custom domain api.amio.love is configured in wrangler.toml via:
#    routes = [{ pattern = "api.amio.love/*", custom_domain = true }]
# Cloudflare handles DNS automatically when the domain is already on Cloudflare.
```

## Manual Deployment

```bash
npm run deploy
# Deploys to https://api.amio.love (and fallback https://amio-world-api.<subdomain>.workers.dev)
```

## Environment Variables / Secrets

| Name | Type | Description |
|------|------|-------------|
| `OPENROUTER_API_KEY` | Secret | OpenRouter API key — set via `wrangler secret put` |
| `OPENROUTER_MODEL` | Var (wrangler.toml) | Model name, e.g. `deepseek/deepseek-chat` |
| `WORLD_KV` | KV Binding | Cloudflare KV namespace for world persistence |

## API Endpoints

### `GET /health`

Returns server status.

### `POST /api/chat`

Send a user message to an AI agent and receive a reply with optional build action.

```json
// Request
{
  "agentId": "agent-1",
  "message": "Build a monument called Four-Dollar Racket Monument",
  "worldContext": {
    "agentId": "agent-1",
    "agentName": "Builder-01",
    "agentZone": "Central Zone",
    "agentCurrentTask": null,
    "buildingCount": 3,
    "nearbyBuildings": [],
    "userDailyBuildCount": 0,
    "userId": "player"
  },
  "history": []
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

Persist world state to Cloudflare KV.

```json
// Request body: WorldStateJSON
{ "version": 1, "agents": [...], "buildings": [...] }

// Response
{ "success": true }
```

### `GET /api/load-world`

Load world state from Cloudflare KV.

```json
// Response
{ "worldState": { "version": 1, "agents": [...], "buildings": [...] } }
// or { "worldState": null } if not yet saved
```

## Architecture

```
Cloudflare Edge
  └─ Worker (Hono)
       ├─ POST /api/chat  →  OpenRouter LLM API (external fetch)
       ├─ POST /api/save-world  →  Cloudflare KV (write)
       └─ GET  /api/load-world  →  Cloudflare KV (read)
```

The `OPENROUTER_API_KEY` secret is injected by Cloudflare at runtime — it never appears in source code, build artifacts, or git history.
