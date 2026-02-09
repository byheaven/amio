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
npm run test:bdd                      # Run BDD tests only (*.steps.ts)
npm run test:unit                     # Run unit tests only (unit/*)
npm test -- --testPathPattern=chest   # Run specific feature/domain
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

## Testing & BDD

**Framework**: BDD-first with jest-cucumber + Gherkin feature files. All new development follows the BDD workflow.

### BDD Workflow

```
1. Write .feature file first  →  describe expected behavior
2. Create .steps.ts file      →  run tests to see suggested stubs
3. RED                         →  fill in assertions, tests fail
4. GREEN                       →  implement production code
5. REFACTOR                    →  extract helpers, style compliance
6. VERIFY                      →  run specific feature, then full suite
```

### Directory Structure

```
__tests__/
  features/          # Gherkin .feature files (English keywords)
    game/            # tile-matching, tile-blocking, game-over
    chest/           # chest-calculation, chest-hero-upgrade, chest-lifecycle
    daily-level/     # daily-level-generation, hero-level-generation
    tools/           # undo-tool, shuffle-tool, pop-tool
    energy/          # power-core, streak-multiplier, planet-stages
    storage/         # daily-reset, data-migration, story-progress
  steps/             # .steps.ts files (mirrors features/)
    game/
    chest/
    daily-level/
    tools/
    energy/
    storage/
  helpers/           # Shared test utilities
    bdd-setup.ts           # jest-cucumber global config
    tile-factory.ts        # TileData fixture creation
    game-stats-factory.ts  # GameStats fixture creation
    storage-mock.ts        # Taro storage mock
    date-mock.ts           # Date mocking for daily-reset tests
  unit/              # Non-BDD supplemental tests (optional)
```

### Feature File Conventions

- **Language**: English Gherkin keywords (`Feature`, `Scenario`, `Given`, `When`, `Then`)
- **Comments**: Chinese allowed only in comments
- **Naming**: `kebab-case.feature` (e.g., `chest-calculation.feature`)
- **Scope**: One feature per file, organized by business domain
- **Tags**: `@unit` (pure functions), `@integration` (requires mocks), domain tags (`@chest`, `@game-logic`, `@energy`, `@tools`, `@storage`)

Example:
```gherkin
Feature: Chest Level Calculation
  As a player
  I want the game to award me a chest based on my performance
  So that I am rewarded for playing efficiently

  Scenario Outline: Calculate chest level for normal mode
    Given the player completed the level in <attempts> attempts
    And the player used <toolsUsed> tools
    When the chest level is calculated
    Then the chest should be <chestLevel>

    Examples:
      | attempts | toolsUsed | chestLevel |
      | 1        | 0         | diamond    |
      | 1        | 1         | gold       |
```

### Step Definition Pattern

```typescript
import { defineFeature, loadFeature } from 'jest-cucumber';
import { functionUnderTest } from '@/utils/someUtil';
import { createGameStats } from '../../helpers/game-stats-factory';
import '../../helpers/bdd-setup';  // REQUIRED: Import for error config

const feature = loadFeature('__tests__/features/domain/feature-name.feature');

defineFeature(feature, (test) => {
  test('Scenario name from feature file', ({ given, and, when, then }) => {
    let inputVar: Type;
    let result: Type;

    given(/^step with (\d+) capture group$/, (capturedValue) => {
      inputVar = parseInt(capturedValue, 10);
    });

    when('action happens', () => {
      result = functionUnderTest(inputVar);
    });

    then(/^result should be (.+)$/, (expected) => {
      expect(result).toBe(expected);
    });
  });
});
```

### Test Helpers

| Helper | Purpose |
|--------|---------|
| `bdd-setup.ts` | jest-cucumber error configuration (import in every .steps.ts) |
| `tile-factory.ts` | `createTile()`, `createTilesFromTypes(['BAMBOO', 'SHARK'])` |
| `game-stats-factory.ts` | `createGameStats({ attempts: 2, toolsUsed: 1 })` |
| `storage-mock.ts` | In-memory Taro storage mock for `getStorageSync`/`setStorageSync` |
| `date-mock.ts` | `setMockDate('2024-01-15')`, `advanceDateByDays(1)` |

### Mocking Patterns

**Taro APIs** (use storage-mock helper):
```typescript
import { mockTaroStorage } from '../../helpers/storage-mock';
const { storage } = mockTaroStorage();
```

**Date** (use date-mock helper):
```typescript
import { setMockDate, restoreRealTimers } from '../../helpers/date-mock';
beforeEach(() => setMockDate('2024-01-15'));
afterEach(() => restoreRealTimers());
```

**Math.random** (for seeded RNG tests):
```typescript
let mockRandom: jest.SpyInstance;
beforeEach(() => {
  mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);
});
afterEach(() => mockRandom.mockRestore());
```

### Testing Principles

1. **Pure utils are primary BDD targets** — functions in `utils/` take inputs → return outputs → easy to test
2. **Components tested via props/callbacks** — pass test data, verify callbacks fired
3. **UI snapshot tests are supplemental** — use sparingly, never as primary verification
4. **Mock at boundaries** — mock Taro APIs and external dependencies, not internal utilities
5. **One assertion per scenario** — if you need multiple checks, write multiple scenarios

### Tags for Filtering

Run tests by tag using Jest's `--testNamePattern`:
```bash
npm test -- --testPathPattern=chest      # All chest-related tests
npm test -- --testPathPattern=game       # All game logic tests
npm test -- --testPathPattern=tools      # All tool-related tests
```

### Reference Implementation

See `__tests__/features/chest/chest-calculation.feature` + `__tests__/steps/chest/chest-calculation.steps.ts` for a complete BDD example using Scenario Outline with Examples table.

## Product Context

See `docs/AMIO_MVP_PRD_V3.md` for detailed product requirements including:
- Daily cycle: play today → unlock chest tomorrow → 24hr claim window
- Streak rewards at 7/14/30/60 days
- First idol theme: "Shark Star" (table tennis themed)
