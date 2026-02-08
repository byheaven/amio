# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AMIO is an idol-themed 3-Tiles match game platform built with Taro 3.6.x for cross-platform deployment (H5, WeChat Mini Program, Douyin Mini Program). Players click tiles to add them to a 7-slot row; matching 3 identical tiles clears them. The game features daily levels, a chest reward system, and Hero mode for bonus challenges.

## Development Commands

All commands run from `amio-app/`:

```bash
cd amio-app

# Development
npm run dev:h5          # H5 dev server with hot reload (localhost:10086)
npm run dev:weapp       # WeChat mini-program watch mode

# Production
npm run build:h5        # Build for H5/web
npm run build:weapp     # Build for WeChat Mini Program

# Testing
npm test                              # Run all tests
npm test -- --testPathPattern=gameLogic   # Run specific test file
npm test -- --testNamePattern="checkMatch" # Run specific test by name
npm test -- --watch                   # Watch mode
npm test -- --coverage                # Coverage report
```

## Architecture

### Tech Stack
- **Taro 3.6.x** (React-based cross-platform framework)
- **React 18** + **TypeScript 5.x**
- **SCSS** for styling (BEM-like: `.tile`, `.tile--disabled`, `.tile__icon`)
- **Jest** (jsdom) for testing (`amio-app/__tests__/`)
- **localStorage** for data persistence (single key: `amio_game_progress`)

### Path Alias
`@/*` → `./src/*` (configured in tsconfig.json and Taro config)

### State Management Pattern
No Redux or Context. The **Game page** (`pages/game/index.tsx`) is the sole state orchestrator:
- All game state lives in the Game page as React hooks (`useState`, `useRef`)
- Components (`Board`, `Slot`, `TempSlot`, `ToolBar`) are **presentational only** — they receive props and fire callbacks
- `useRef` persists daily layout across retries (same positions, new tile types)
- Pure utility functions in `utils/` take current state and return new state (no side effects)

### Navigation Patterns

**Tab bar pages** (Starlight, Star Ocean, Home) stay in memory when navigated away. Any tabBar page displaying data modified by other pages **MUST** use `useDidShow` (from `@tarojs/taro`) to refresh data, not just `useEffect`.

**Tab navigation** must use `Taro.switchTab()` with error handling and `Taro.navigateTo()` fallback.

## Game Parameters

| Parameter | Normal Mode | Hero Mode |
|-----------|-------------|-----------|
| Tiles | 75 (25 triplets) | 150 (50 triplets) |
| Layers | 6 (0-5) | 8 (0-7) |
| Grid | 9 columns × 12 rows | 9 columns × 12 rows |
| Seed offset | 0 | +1000 |
| Tile size | 2×2 units | 2×2 units |

**Daily level generation**: Date-based seed → fixed positions (same for all users) → random tile types (change on retry).

## Core Game Logic

- **Tile blocking** (`gameLogic.ts`): Higher-layer tiles block lower ones via overlap detection
- **Daily levels** (`dailyLevel.ts`): Seeded RNG (Linear Congruential Generator) from date string hash
- **Hero levels** (`heroLevel.ts`): Same algorithm, seed+1000 offset, more tiles/layers
- **Tool mechanics** (`toolsLogic.ts`): Undo (return last tile), Shuffle (randomize positions), Pop (move to temp stacks)
- **Chest calculation** (`chestLogic.ts`): Level based on attempts + tools used; Hero mode upgrades chest by +2 levels

### Chest System
| Level | Condition |
|-------|-----------|
| Diamond | 1 attempt + 0 tools |
| Gold | 1-2 attempts + ≤1 tool |
| Silver | 3-5 attempts + ≤2 tools |
| Bronze | 6+ attempts or 3 tools |

### Data Persistence (`storage.ts`)
Single `GameProgress` object in localStorage with daily auto-reset when date changes. Key functions: `loadProgress()`, `saveProgress()`, `savePendingChest()`, `claimChest()`, `getChestStatus()`.

## Key Types (src/constants/game.ts)

```typescript
enum TileType { BAMBOO, DOT, CHARACTER, PINGPONG, SHARK, STAR, RACKET, MEDAL, HEART }
enum GameMode { NORMAL, HERO }
enum ChestLevel { DIAMOND, GOLD, SILVER, BRONZE }
interface GameStats { attempts: number; toolsUsed: number; undoUsed: boolean; shuffleUsed: boolean; popUsed: boolean; }
MAX_SLOTS = 7  // Slot capacity before game over
```

## Game State Flow

1. **Daily Level**: Generated with date-based seed (same layout for all users)
2. **Normal Mode**: Click unblocked tiles → move to slot → auto-clear triplets
3. **Win**: All tiles cleared from board + slot + temp stacks
4. **Lose**: Slot fills to 7 without matching
5. **Chest Award**: Calculate level based on attempts + tools used
6. **Hero Mode**: Optional harder challenge after normal completion (upgrades chest +2 levels)

## Code Style

- **Indentation**: 2 spaces (enforced by `.editorconfig`)
- **Line endings**: LF
- **React 18 JSX transform**: No `import React` needed in JSX files
- **TypeScript**: `strictNullChecks: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- **Never** use `as any`, `@ts-ignore`, or `@ts-expect-error` to suppress errors
- **Naming**: PascalCase for components/folders/enums/interfaces, camelCase for functions/util files, SCREAMING_SNAKE_CASE for constants
- **Import order**: React → Taro components → project types/constants → local components → styles
- **SCSS**: Component-scoped files, BEM-like naming, max 3 levels of nesting

## Testing

- **Location**: `amio-app/__tests__/` directory
- **Pattern**: `*.(test|spec).[jt]s?(x)`
- **Framework**: Jest with `@tarojs/test-utils-react` and jsdom
- Mock Taro APIs inline: `jest.mock('@tarojs/taro', () => ({ switchTab: jest.fn(), ... }))`

## Product Context

See `docs/AMIO_MVP_PRD_V3.md` for detailed product requirements including:
- Daily cycle: play today → unlock chest tomorrow → 24hr claim window
- Streak rewards at 7/14/30/60 days
- First idol theme: "Shark Star" (table tennis themed)
