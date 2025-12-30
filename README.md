# AMIO - AI-Powered Fan Game Platform

> Play games, win merchandise

An idol-themed 3-Tiles match game platform.

## 🎮 Features

- **3-Tiles Match Gameplay**: Click to select tiles, match 3 identical tiles to clear them
- **Daily Levels**: One level per day, same layout for all users
- **Game Props**: Undo, Shuffle, Pop (stacking)
- **Story System**: Unlock daily story chapters after completing levels (typewriter animation)
- **Treasure Chest**: Complete levels to earn chests, unlock next day
- **Chest Levels**: Bronze/Silver/Gold/Diamond based on attempts and prop usage
- **Intro Story**: Immersive opening story sequence for new users

## 🛠 Tech Stack

- **Framework**: Taro 4.x (React)
- **Language**: TypeScript
- **Styling**: SCSS
- **Platforms**: H5, WeChat Mini Program, Douyin Mini Program

## 🚀 Quick Start

```bash
# Install dependencies
cd amio-app
npm install

# Start H5 dev server
npm run dev:h5

# Build for WeChat Mini Program
npm run build:weapp

# Build for H5
npm run build:h5
```

## 📁 Project Structure

```
amio/
├── amio-app/                # Taro application
│   ├── src/
│   │   ├── components/      # Components
│   │   │   ├── Board/       # Game board
│   │   │   ├── Tile/        # Tile piece
│   │   │   ├── Slot/        # Collection slot
│   │   │   ├── TempSlot/    # Temporary slot (Pop)
│   │   │   ├── ToolBar/     # Toolbar
│   │   │   ├── StoryModal/  # Story cutscene modal
│   │   │   └── ChestModal/  # Chest reward modal
│   │   ├── pages/           # Pages
│   │   │   ├── home/        # Home page
│   │   │   └── game/        # Game page
│   │   ├── utils/           # Utilities
│   │   │   ├── gameLogic.ts # Core game logic
│   │   │   ├── dailyLevel.ts# Daily level generation
│   │   │   └── toolsLogic.ts# Game props logic
│   │   └── constants/       # Constants
│   └── config/              # Taro config
└── docs/                    # Documentation
    └── AMIO_MVP_PRD_V3.md   # Product requirements
```

## 📝 Development Progress

- [x] Phase 1: Core game loop
- [x] Phase 2: Visuals & props system
- [x] Phase 3: Daily levels & chest rewards
- [x] Phase 4: Chest level system
- [x] Phase 5: Story system (post-level cutscenes)
- [x] Phase 6: Intro story page (new user onboarding)

## 📜 License

MIT
