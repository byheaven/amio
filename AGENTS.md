
# AGENTS.md - Development Guide for AI Agents

This guide provides essential context for agents working on the AMIO project (idol-themed 3-Tiles match game).

## Project Overview

- **Framework**: Taro 3.6.x (React-based cross-platform)
- **Language**: TypeScript 5.x
- **Styling**: SCSS
- **Testing**: Jest with jsdom
- **Platforms**: H5, WeChat Mini Program, Douyin Mini Program
- **Path Alias**: `@/*` → `./src/*`

## Build Commands

All commands run from `amio-app/` directory:

```bash
# Development
npm run dev:h5              # H5 dev server (localhost:10086)
npm run dev:weapp           # WeChat mini-program watch mode

# Production Build
npm run build:h5            # Build for H5/web
npm run build:weapp         # Build for WeChat Mini Program

# Testing
npm test                    # Run all tests
npm test -- --testPathPattern=gameLogic  # Run specific test file
npm test -- --testNamePattern="checkMatch"  # Run specific test by name
```

## Code Style Guidelines

### Formatting & Indentation
- 2-space indentation (enforced by `.editorconfig`)
- Use LF line endings
- Trim trailing whitespace (except in Markdown)
- Insert final newline in all files

### TypeScript (tsconfig.json)
- `strictNullChecks: true` is enabled
- `noUnusedLocals: true` - remove unused variables
- `noUnusedParameters: true` - remove unused function params
- `noImplicitAny: false` - implicit any is allowed (but avoid it)
- **Never** use `as any`, `@ts-ignore`, or `@ts-expect-error` to suppress errors
- Use interfaces for objects, enums for fixed sets

### ESLint
- Extends `taro/react` config
- React 18 new JSX transform (no React import needed in JSX files)

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
// Use React.FC<T> for functional components
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
- **Never** use empty catch blocks: `catch(e) {}`
- Handle errors gracefully with user feedback or fallback values
- Log errors for debugging: `console.error('Failed to load:', error)`

### SCSS Patterns
- Component-scoped styles: `Tile.scss`, `Board.scss`
- Use BEM-like naming: `.tile`, `.tile--disabled`, `.tile__icon`
- Keep styles simple; avoid deep nesting (max 3 levels)

## Project Structure

```
amio-app/src/
├── components/          # React components (PascalCase folders)
│   ├── Board/           # Game board with tile grid
│   ├── Tile/            # Individual tile piece
│   ├── Slot/            # 7-slot collection row
│   ├── TempSlot/        # Temporary storage (Pop tool)
│   ├── ToolBar/         # Undo/Shuffle/Pop tools
│   ├── StoryModal/      # Story cutscene modal
│   ├── ChestModal/      # Victory result modal
│   └── ChestRewardModal/# Chest reward display
├── pages/               # Route pages
│   ├── home/            # Home page
│   └── game/            # Main game page
├── utils/               # Pure function logic (camelCase files)
│   ├── gameLogic.ts     # Core matching/collision detection
│   ├── dailyLevel.ts    # Seed-based level generation
│   ├── heroLevel.ts     # Hero mode levels (harder)
│   ├── toolsLogic.ts    # Undo/Shuffle/Pop mechanics
│   ├── chestLogic.ts    # Chest level calculation
│   └── storage.ts       # localStorage persistence
├── constants/           # Types and constants
│   ├── game.ts          # TileType, TileData, GameStats, ChestLevel
│   ├── icons.ts         # SVG icon definitions
│   └── storyData.ts     # Story content by day
└── assets/              # Static assets
```

## Test Patterns

- Location: `amio-app/__tests__/` directory
- Pattern: `*.test.(ts|tsx)` or `*.spec.(ts|tsx)`
- Framework: Jest with `@tarojs/test-utils-react`
- Environment: jsdom

```typescript
// Example test structure
describe('gameLogic', () => {
  test('checkMatch removes triplets', () => {
    // Arrange
    const slots = [/* tiles */];
    // Act
    const result = checkMatch(slots);
    // Assert
    expect(result.matched).toBe(true);
  });
});
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

1. **Type Safety**: Never suppress TypeScript errors with `as any` or `@ts-ignore`
2. **Error Handling**: Never leave empty catch blocks
3. **Testing**: Never delete failing tests to "pass"
4. **Git**: Never commit without explicit user request
5. **Visual Changes**: Delegate styling/layout/animation work to `frontend-ui-ux-engineer` agent

## Additional Context

See `CLAUDE.md` for full project documentation including:
- Game mechanics and rules
- Chest level calculation logic
- Data persistence strategy
- Story system details
