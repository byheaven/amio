# AGENTS.md - Development Guide for AI Agents

This document is the primary implementation guide for agents working on AMIO.

## Project Overview

AMIO is an idol-themed 3-Tiles match game built with Taro 3.6.x for H5, WeChat Mini Program, and Douyin Mini Program. Players click tiles into a 7-slot row; three matching tiles are cleared. The project includes daily levels, a chest reward system, and Hero mode.

- **Framework**: Taro 3.6.x (React-based cross-platform)
- **Language**: TypeScript 5.x
- **Styling**: SCSS
- **Testing**: Jest (jsdom) + jest-cucumber
- **Platforms**: H5, WeChat Mini Program, Douyin Mini Program
- **Path Alias**: `@/*` → `./src/*`

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

- **Taro 3.6.x**, **React 18**, **TypeScript 5.x**
- **SCSS** with BEM-like naming
- **Jest** (`@tarojs/test-utils-react`) + **jest-cucumber**
- **localStorage** persistence via `src/utils/storage.ts`

### State Management Pattern

- Gameplay state is page-scoped and orchestrated in `src/pages/game/index.tsx`.
- Components such as `Board`, `Slot`, `TempSlot`, and `ToolBar` should remain presentational (props in, callbacks out).
- Pure game/domain logic should live in `src/utils/*`.
- `useRef` can be used to persist layout/state across retries when needed.
- **Theme runtime exception**: global `ThemeContext` usage is allowed under `src/themes/*` for theme metadata resolution, icon lookup, theme class application, persistence, and cross-page theme sync. Do not use ThemeContext as a generic global gameplay store.

### Navigation Patterns

- Tab bar pages remain mounted when switching tabs.
- Any tab bar page showing mutable data **must** refresh in `useDidShow` (not only `useEffect`).
- Prefer `Taro.switchTab()` for tab navigation and include error handling with `Taro.navigateTo()` fallback.

## Game Parameters

| Parameter | Normal Mode | Hero Mode |
|-----------|-------------|-----------|
| Tiles | 75 (25 triplets) | 150 (50 triplets) |
| Layers | 6 (0-5) | 8 (0-7) |
| Grid | 9 columns × 12 rows | 9 columns × 12 rows |
| Seed offset | 0 | +1000 |
| Tile size | 2×2 units | 2×2 units |

Daily level generation: date-based seed → fixed positions (same layout for all users) → randomized tile type distribution on retry.

## Core Game Logic

- **Tile blocking** (`src/utils/gameLogic.ts`): higher-layer overlap blocks lower tiles.
- **Daily levels** (`src/utils/dailyLevel.ts`): deterministic seeded generation.
- **Hero levels** (`src/utils/heroLevel.ts`): same algorithm with harder parameters.
- **Tool mechanics** (`src/utils/toolsLogic.ts`): Undo / Shuffle / Pop.
- **Chest calculation** (`src/utils/chestLogic.ts`): attempts + tool usage; Hero mode may upgrade chest level.

### Chest System

| Level | Condition |
|-------|-----------|
| Diamond | 1 attempt + 0 tools |
| Gold | 1-2 attempts + ≤1 tool |
| Silver | 3-5 attempts + ≤2 tools |
| Bronze | 6+ attempts or 3 tools |

### Data Persistence

Game progress is stored in local storage and supports daily reset logic. Key functions are in `src/utils/storage.ts` (e.g., `loadProgress()`, `saveProgress()`, chest lifecycle helpers).

## Code Style Guidelines

### Formatting & Indentation

- 2-space indentation (enforced by `.editorconfig`)
- LF line endings
- Trim trailing whitespace (except Markdown)
- Final newline in all files

### TypeScript

- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitAny: false` (implicit any allowed, but avoid it)
- **Never** use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Prefer interfaces for object contracts and enums for fixed sets

### ESLint

- Extends `taro/react`
- React 18 JSX transform is enabled (React import is optional unless needed for typing/API usage)

### Naming Conventions

| Type | Convention | Examples |
|------|------------|----------|
| Enums | PascalCase | `TileType`, `ChestLevel`, `GameMode` |
| Interfaces | PascalCase | `TileData`, `GameStats` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_SLOTS`, `TILE_WIDTH_UNIT` |
| Functions | camelCase | `isTileBlocked`, `updateClickableStatus` |
| Components | PascalCase | `Tile`, `Board`, `ChestModal` |
| Utility files | camelCase | `gameLogic.ts`, `dailyLevel.ts` |
| Component folders | PascalCase | `Tile/`, `Board/`, `ChestModal/` |

### Imports

```typescript
// Standard import order
import React from 'react';
import { View, Text } from '@tarojs/components';
import { TileData, TileType } from '../../constants/game';
import Tile from '../Tile/Tile';
import './Tile.scss';
```

### React Components

```typescript
interface TileProps {
  data: TileData;
  onClick: (tile: TileData) => void;
  width?: number;
}

const Tile: React.FC<TileProps> = ({ data, onClick, width = 60 }) => {
  const handleClick = () => {
    if (data.isClickable) {
      onClick(data);
    }
  };

  return <View onClick={handleClick}>...</View>;
};

export default Tile;
```

### Error Handling

- **Never** use empty catch blocks (e.g., `catch (e) {}`)
- Handle errors with fallback behavior and/or user feedback
- Log actionable failures: `console.error('Failed to load:', error)`

### SCSS Patterns

- Use component-scoped styles (`Tile.scss`, `Board.scss`)
- Follow BEM-like naming (`.tile`, `.tile--disabled`, `.tile__icon`)
- Avoid deep nesting (max 3 levels)

## Testing & BDD

Framework: BDD-first with jest-cucumber, plus unit/integration tests under Jest.

### BDD Workflow

1. Write `.feature` file first.
2. Add corresponding `.steps.ts` implementation.
3. RED: assertions fail first.
4. GREEN: implement production logic.
5. REFACTOR: clean up while tests stay green.
6. VERIFY: run focused and full suites.

### Test Directory Structure

```
__tests__/
  features/          # Gherkin feature files
  steps/             # jest-cucumber step definitions
  helpers/           # Shared test utilities and mocks
  unit/              # Supplemental non-BDD tests
```

### Feature File Conventions

- English Gherkin keywords: `Feature`, `Scenario`, `Given`, `When`, `Then`
- Chinese comments are allowed only in comments
- File naming: `kebab-case.feature`
- One feature file per business behavior/domain

### Step Definition Pattern

```typescript
import { defineFeature, loadFeature } from 'jest-cucumber';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/domain/feature-name.feature');

defineFeature(feature, (test) => {
  test('Scenario name from feature file', ({ given, when, then }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Test Helpers

- `__tests__/helpers/bdd-setup.ts`: jest-cucumber global configuration
- `__tests__/helpers/tile-factory.ts`: tile fixtures
- `__tests__/helpers/game-stats-factory.ts`: game stats fixtures
- `__tests__/helpers/storage-mock.ts`: Taro storage mock
- `__tests__/helpers/date-mock.ts`: date/time mocks for daily-reset scenarios

### Mocking Principles

- Mock at boundaries (Taro APIs, date, random), not internal logic.
- Keep scenarios focused and deterministic.
- Do not use snapshot tests as primary behavior validation.

## Project Structure

```
amio-app/src/
├── components/          # React components (PascalCase folders)
│   ├── Board/
│   ├── Tile/
│   ├── Slot/
│   ├── TempSlot/
│   ├── ToolBar/
│   ├── StoryModal/
│   ├── ChestModal/
│   └── ChestRewardModal/
├── pages/               # Route pages
│   ├── home/
│   ├── game/
│   ├── starlight/
│   ├── starocean/
│   ├── world/
│   └── intro/
├── themes/              # Theme runtime (provider/registry/presets)
│   ├── ThemeContext.tsx
│   ├── registry.ts
│   ├── types.ts
│   └── presets/
├── utils/               # Pure/domain logic
│   ├── gameLogic.ts
│   ├── dailyLevel.ts
│   ├── heroLevel.ts
│   ├── toolsLogic.ts
│   ├── chestLogic.ts
│   └── storage.ts
├── constants/           # Types and static constants
│   ├── game.ts
│   └── storyData.ts
└── assets/
```

## Key Types (src/constants/game.ts)

```typescript
enum TileType { BAMBOO, DOT, CHARACTER, PINGPONG, SHARK, STAR, RACKET, MEDAL, HEART }
enum GameMode { NORMAL, HERO }
enum ChestLevel { DIAMOND, GOLD, SILVER, BRONZE }

interface TileData {
  id: string;
  type: TileType;
  layer: number;
  x: number;
  y: number;
  isClickable: boolean;
}

interface GameStats {
  attempts: number;
  toolsUsed: number;
  undoUsed: boolean;
  shuffleUsed: boolean;
  popUsed: boolean;
}

const MAX_SLOTS = 7;
```

## Important Constraints

1. **Type Safety**: Never suppress TypeScript errors with `as any`, `@ts-ignore`, or `@ts-expect-error`.
2. **Error Handling**: Never leave empty catch blocks.
3. **Testing**: Never delete or weaken failing tests just to pass CI.
4. **Git Discipline**: Never commit without explicit user request.
5. **Visual Changes**: Delegate styling/layout/animation design-heavy work to `frontend-ui-ux-engineer`.
6. **Navigation Correctness**: Tab-bar data refresh must use `useDidShow`; tab switches should use `switchTab` with fallback handling.
7. **Theme Scope**: ThemeContext is allowed only for theme runtime concerns, not generic gameplay global state.

## Product Context

Primary product requirements live in `docs/AMIO_MVP_PRD_V3.md`, including:

- Daily loop and chest claim lifecycle
- Streak rewards and progression milestones
- Hero mode expectations
- Theme direction and content framing
