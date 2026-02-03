# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AMIO is an idol-themed 3-Tiles match game platform built with Taro 4.x for cross-platform deployment (H5, WeChat Mini Program, Douyin Mini Program). Players click tiles to add them to a 7-slot row; matching 3 identical tiles clears them. The game features daily levels, a chest reward system, and Hero mode for bonus challenges.

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
npm test                # Run Jest tests
```

## Architecture

### Tech Stack
- **Taro 3.6.x** (React-based cross-platform framework)
- **React 18** + **TypeScript**
- **SCSS** for styling
- **Jest** (jsdom) for testing
- **localStorage** for data persistence

### Directory Structure
```
amio-app/src/
├── components/     # UI components
│   ├── Board/         # Game board with tiles
│   ├── Tile/          # Individual tile component
│   ├── Slot/          # 7-slot selection row
│   ├── TempSlot/      # Temporary storage (3 stacks)
│   ├── ToolBar/       # Undo/Shuffle/Pop tools
│   └── ChestModal/    # Victory result modal
├── pages/          # Route pages
│   ├── intro/         # Intro story page (first-time user experience)
│   ├── starlight/     # Starlight tab (main hub)
│   ├── starocean/     # Star Ocean tab
│   ├── home/          # Home page (chest status, streak, game entry)
│   └── game/          # Main game page
├── utils/          # Pure function game logic
│   ├── gameLogic.ts   # Core matching/collision detection
│   ├── dailyLevel.ts  # Seed-based daily level generation
│   ├── heroLevel.ts   # Hero mode level generation (harder)
│   ├── toolsLogic.ts  # Undo/Shuffle/Pop tool mechanics
│   ├── chestLogic.ts  # Chest level calculation
│   └── storage.ts     # localStorage persistence
├── constants/      # Types and game constants
└── assets/         # Static assets
```

### Path Alias
`@/*` → `./src/*` (configured in tsconfig.json and Taro config)

## Navigation & Page Flow

### Intro Page (src/pages/intro/index.tsx)
First-time user experience showing the "Shark Star" story introduction.

**Navigation Pattern:**
- Uses `Taro.switchTab()` with error handling and fallback to navigate to Starlight tab
- Implements success/fail callbacks to catch navigation failures
- Falls back to `Taro.navigateTo()` if `switchTab` fails
- Marks intro as seen via `markIntroSeen()` before navigation

**Important:** Always use `Taro.switchTab()` for tab bar pages with proper error handling:
```typescript
Taro.switchTab({
    url: '/pages/starlight/index',
    success: () => console.log('Navigation successful'),
    fail: (err) => {
        console.error('Navigation failed:', err);
        Taro.navigateTo({ url: '/pages/starlight/index' });
    }
});
```

### TabBar Page Data Refresh Pattern (Critical)

**Problem:** `useEffect` with empty dependency array only runs on component mount. When using `Taro.switchTab()` to navigate between tabBar pages, the page component is NOT re-mounted (it remains in memory). This causes stale data to display.

**Solution:** Always use `useDidShow` lifecycle hook to refresh data when tabBar pages become visible:

```typescript
import { useDidShow } from '@tarojs/taro';
import { loadProgress } from '../../utils/storage';

const MyTabPage: React.FC = () => {
  const [progress, setProgress] = useState(null);

  // Load on initial mount
  useEffect(() => {
    refreshData();
  }, []);

  // Refresh when page becomes visible (after switchTab from game page)
  useDidShow(() => {
    refreshData();
  });

  const refreshData = () => {
    const data = loadProgress();
    setProgress(data);
  };
};
```

**Rule:** Any tabBar page that displays data modified by other pages MUST use `useDidShow` to refresh.

### Tab Bar Pages
- **Starlight** (`pages/starlight/index`): Main hub page
- **Star Ocean** (`pages/starocean/index`): Star Ocean feature page
- **Home** (`pages/home/index`): Home/profile page

## Core Game Logic

### Tile Mechanics (src/utils/gameLogic.ts)
- `isTileBlocked(tile, allTiles)` - Collision detection for stacked tiles
- `updateClickableStatus(tiles)` - Determines which tiles can be clicked
- `generateLevel(config)` - Creates random tile layout with layers
- `checkMatch(slotTiles)` - Removes matching triplets from slot

### Daily Level (src/utils/dailyLevel.ts)
- `getDailyLayoutSeed()` - Date-based seed for consistent daily layouts
- `generateDailyLayout(seed, count)` - Fixed positions for the day
- `assignRandomTileTypes(layout)` - Random tile types on fixed layout

### Hero Mode (src/utils/heroLevel.ts)
- `generateHeroLevel(seed)` - 108 tiles, 6 layers (vs 30 tiles, 5 layers for normal)
- Higher difficulty with more tile types and deeper stacking

### Chest System (src/utils/chestLogic.ts)
| Level | Condition |
|-------|-----------|
| Diamond | 1 attempt + 0 tools |
| Gold | 1-2 attempts + ≤1 tool |
| Silver | 3-5 attempts + ≤2 tools |
| Bronze | 6+ attempts or 3 tools |

- `calculateChestLevel(stats)` - Determine chest based on performance
- `upgradeChestForHero(level)` - +2 levels for Hero mode completion

### Data Persistence (src/utils/storage.ts)
- `loadProgress()` / `saveProgress()` - Game progress management
- `savePendingChest()` - Store earned chest (24hr unlock, 24hr expiry)
- `claimChest()` - Claim unlocked chest, update streak
- `getChestStatus()` - Check chest state (none/locked/unlocked/expired)
- `getNextStoryDay()` - Get next story day to display
- `markStoryViewed(day)` - Mark story as viewed

### Story System (src/constants/storyData.ts)
- 7 days of story content for Sun Yingsha's table tennis journey
- `getStoryByDay(day)` - Get story content for specific day

### Story Modal (src/components/StoryModal/)
- Displays after level completion (before chest modal)
- Typewriter text animation effect
- Skip button + Continue button

## Key Types (src/constants/game.ts)

```typescript
// Tile types (9 total)
enum TileType { BAMBOO, DOT, CHARACTER, PINGPONG, SHARK, STAR, RACKET, MEDAL, HEART }

// Game modes
enum GameMode { NORMAL, HERO }

// Chest levels
enum ChestLevel { DIAMOND, GOLD, SILVER, BRONZE }

// Game statistics for chest calculation
interface GameStats {
  attempts: number;      // Retry count
  toolsUsed: number;     // Tools used this game
  undoUsed: boolean;
  shuffleUsed: boolean;
  popUsed: boolean;
}

MAX_SLOTS = 7  // Slot capacity before game over
```

## Game State Flow

1. **Daily Level**: Generated with date-based seed (same layout for all users)
2. **Normal Mode**: Click unblocked tiles → move to slot → auto-clear triplets
3. **Win Condition**: Clear all tiles from board + slot + temp stacks
4. **Lose Condition**: Slot fills to 7 without matching
5. **Chest Award**: Calculate level based on attempts + tools used
6. **Hero Mode**: Optional harder challenge after normal completion
   - 108 tiles, 6 layers
   - Can retry unlimited times
   - Success upgrades chest by 2 levels

## Props System

Each tool usable once per game:
- **Undo**: Return last tile to board
- **Pop**: Move 3 tiles to temp storage (3 stacks available)
- **Shuffle**: Randomize remaining board tiles

## Testing Features

- **Reset Button** (🔄): Clears all localStorage data for testing
- **One-Click Win** (🎯): Instantly completes current level

## Product Context

See `docs/AMIO_MVP_PRD_V3.md` for detailed product requirements including:
- Daily cycle: play today → unlock chest tomorrow → 24hr claim window
- Streak rewards at 7/14/30/60 days
- First idol theme: "Shark Star" (table tennis themed)
