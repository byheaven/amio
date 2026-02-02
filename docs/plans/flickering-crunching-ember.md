# Shark Star World Development System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the AMIO 3-Tiles game into a planet development narrative system with dual energy tracking, 3-tab navigation, planet visual evolution, and personal milestone timeline.

**Architecture:** Extend existing Taro/React app with new energy/contribution data structures, replace single-page home with 3-tab layout, add planet visualization that evolves with global progress, and create personal timeline tracking achievements.

**Tech Stack:** Taro 3.6.x, React 18, TypeScript, SCSS, localStorage persistence

---

## Overview

This plan implements the Shark Star world development narrative system across three tabs:
- **星光 (Starlight)**: Daily gameplay, planet visualization, chest collection
- **星海 (Star Ocean)**: Community feed, planet status, inter-planet rankings
- **星轨 (Star Trail)**: Personal identity, energy contribution, achievement timeline

---

### Task 1: Extend Data Models for Energy System

**Files:**
- Modify: `amio-app/src/constants/game.ts:1-50`
- Modify: `amio-app/src/utils/storage.ts:1-100`

**Step 1: Add Energy and Contribution Types**

Add to `constants/game.ts`:

```typescript
// Energy types for planet development
export interface EnergyContribution {
  powerCore: number;        // ⚡ from gaming
  wisdomCrystal: number;    // 💡 from social
  totalContribution: number;
}

export interface UserRanking {
  globalRank: number;
  percentile: number;       // e.g., 5.2 for top 5.2%
  landingBatch: 'pioneer' | 'early_pioneer' | 'builder' | 'resident';
}

export interface DailyEnergy {
  date: string;             // YYYY-MM-DD
  powerCore: number;
  wisdomCrystal: number;
}

export interface PlanetProgress {
  currentProgress: number;  // 0-100
  stage: 'desolate' | 'sprout' | 'construction' | 'prosperity' | 'launch' | 'landing';
  dailyActiveUsers: number;
  todayContribution: {
    powerCore: number;
    wisdomCrystal: number;
  };
}

// Milestone types for timeline
export interface Milestone {
  id: string;
  day: number;
  type: 'streak' | 'achievement' | 'contribution' | 'title' | 'social';
  title: string;
  description: string;
  unlockedAt: string | null;  // null if not yet unlocked
  icon: string;
}

// Achievement/Titles
export interface UserTitle {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
  icon: string;
}
```

**Step 2: Extend GameProgress Interface**

Modify `storage.ts` GameProgress interface:

```typescript
export interface GameProgress {
  // ... existing fields ...

  // Energy system
  energy: EnergyContribution;
  dailyEnergyHistory: DailyEnergy[];

  // Ranking
  ranking: UserRanking;

  // Planet progress (cached from server)
  planetProgress: PlanetProgress;
  lastPlanetSync: string;

  // Milestones and achievements
  milestones: Milestone[];
  titles: UserTitle[];
  currentTitle: string | null;

  // Social
  postsCount: number;
  likesReceived: number;
  commentsReceived: number;
  friendsInvited: number;
}
```

**Step 3: Run Type Check**

Run: `cd amio-app && npx tsc --noEmit`
Expected: PASS (no type errors)

**Step 4: Commit**

```bash
git add amio-app/src/constants/game.ts amio-app/src/utils/storage.ts
git commit -m "feat(energy): add energy system and contribution data models"
```

---

### Task 2: Initialize Default Data and Migration

**Files:**
- Modify: `amio-app/src/utils/storage.ts:100-200`

**Step 1: Create Default Values Function**

Add function to create default progress with new fields:

```typescript
export function createDefaultProgress(): GameProgress {
  const today = new Date().toISOString().split('T')[0];

  return {
    todayDate: today,
    todayAttempts: 0,
    todayCompleted: false,
    todayChestLevel: null,
    heroAttempted: false,
    heroCompleted: false,
    pendingChest: null,
    consecutiveDays: 0,
    lastCompletionDate: null,
    lastClaimDate: null,
    totalDaysPlayed: 0,
    storyProgress: 0,
    viewedStories: [],
    hasSeenIntro: false,

    // New energy fields
    energy: {
      powerCore: 0,
      wisdomCrystal: 0,
      totalContribution: 0,
    },
    dailyEnergyHistory: [],

    ranking: {
      globalRank: 0,
      percentile: 100,
      landingBatch: 'resident',
    },

    planetProgress: {
      currentProgress: 0,
      stage: 'desolate',
      dailyActiveUsers: 1,
      todayContribution: { powerCore: 0, wisdomCrystal: 0 },
    },
    lastPlanetSync: today,

    milestones: generateDefaultMilestones(),
    titles: [],
    currentTitle: null,

    postsCount: 0,
    likesReceived: 0,
    commentsReceived: 0,
    friendsInvited: 0,
  };
}

function generateDefaultMilestones(): Milestone[] {
  return [
    { id: 'first_light', day: 1, type: 'streak', title: '首次发出星光', description: '完成了第一次游戏', unlockedAt: null, icon: '✨' },
    { id: 'week_warrior', day: 7, type: 'streak', title: '连续一周', description: '连续7天完成游戏', unlockedAt: null, icon: '🔥' },
    { id: 'month_master', day: 30, type: 'streak', title: '忠实鲨鱼', description: '连续30天完成游戏', unlockedAt: null, icon: '🦈' },
    { id: 'first_hero', day: 0, type: 'achievement', title: '英雄挑战', description: '首次完成Hero模式', unlockedAt: null, icon: '🦸' },
    { id: 'diamond_hunter', day: 0, type: 'achievement', title: '钻石猎人', description: '获得钻石宝箱', unlockedAt: null, icon: '💎' },
    { id: 'contrib_1k', day: 0, type: 'contribution', title: '千能贡献者', description: '累计贡献1000能量', unlockedAt: null, icon: '⚡' },
    { id: 'contrib_10k', day: 0, type: 'contribution', title: '万能源头', description: '累计贡献10000能量', unlockedAt: null, icon: '🌟' },
  ];
}
```

**Step 2: Update loadProgress with Migration**

Modify `loadProgress()` to handle migration from old format:

```typescript
export function loadProgress(): GameProgress {
  try {
    const saved = Taro.getStorageSync('amio_game_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: ensure new fields exist
      const defaults = createDefaultProgress();
      return {
        ...defaults,
        ...parsed,
        energy: { ...defaults.energy, ...parsed.energy },
        ranking: { ...defaults.ranking, ...parsed.ranking },
        planetProgress: { ...defaults.planetProgress, ...parsed.planetProgress },
        milestones: parsed.milestones || defaults.milestones,
        titles: parsed.titles || defaults.titles,
      };
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return createDefaultProgress();
}
```

**Step 3: Run Type Check**

Run: `cd amio-app && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add amio-app/src/utils/storage.ts
git commit -m "feat(energy): initialize default data and add migration logic"
```

---

### Task 3: Create Energy Calculation Utilities

**Files:**
- Create: `amio-app/src/utils/energyLogic.ts`

**Step 1: Write Energy Logic Module**

```typescript
import { ChestLevel, GameMode } from '../constants/game';
import type { EnergyContribution, DailyEnergy } from '../constants/game';

// Base energy rewards
export const BASE_ENERGY = {
  normalComplete: 100,
  heroComplete: 300,
};

// Chest multipliers
export const CHEST_MULTIPLIER: Record<ChestLevel, number> = {
  [ChestLevel.DIAMOND]: 2.0,
  [ChestLevel.GOLD]: 1.5,
  [ChestLevel.SILVER]: 1.2,
  [ChestLevel.BRONZE]: 1.0,
};

// Streak multipliers
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 1.5;
  if (streakDays >= 14) return 1.3;
  if (streakDays >= 7) return 1.1;
  return 1.0;
}

// Calculate power core energy from game completion
export function calculatePowerCoreEnergy(
  mode: GameMode,
  chestLevel: ChestLevel,
  streakDays: number
): number {
  const base = mode === GameMode.HERO ? BASE_ENERGY.heroComplete : BASE_ENERGY.normalComplete;
  const chestMult = CHEST_MULTIPLIER[chestLevel];
  const streakMult = getStreakMultiplier(streakDays);

  return Math.floor(base * chestMult * streakMult);
}

// Wisdom crystal rewards for social actions
export const WISDOM_REWARDS = {
  shareToPlatform: 50,
  inviteUser: 200,
  createPost: 30,
  receiveLike: 5,
  receiveComment: 10,
  joinTopic: 20,
};

// Daily limits for wisdom crystal
export const WISDOM_LIMITS = {
  postsPerDay: 3,
  likesPerPost: 100,
  commentsPerPost: 50,
};

// Calculate total contribution value (weighted)
export function calculateTotalContribution(energy: EnergyContribution): number {
  return Math.floor(energy.powerCore * 0.6 + energy.wisdomCrystal * 0.4);
}

// Determine landing batch based on percentile
export function determineLandingBatch(percentile: number): string {
  if (percentile <= 1) return 'pioneer';
  if (percentile <= 5) return 'early_pioneer';
  if (percentile <= 20) return 'builder';
  return 'resident';
}

// Get planet stage based on progress percentage
export function getPlanetStage(progress: number): string {
  if (progress >= 100) return 'landing';
  if (progress >= 75) return 'launch';
  if (progress >= 50) return 'prosperity';
  if (progress >= 25) return 'construction';
  if (progress >= 10) return 'sprout';
  return 'desolate';
}

// Stage display names
export const STAGE_NAMES: Record<string, string> = {
  desolate: '荒芜期',
  sprout: '萌芽期',
  construction: '建设期',
  prosperity: '繁荣期',
  launch: '启航期',
  landing: '登陆期',
};

// Mock function to simulate server sync of planet progress
// In real implementation, this would call an API
export function syncPlanetProgress(): Promise<{
  progress: number;
  activeUsers: number;
  todayPowerCore: number;
  todayWisdomCrystal: number;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        progress: 67.3,  // Mock global progress
        activeUsers: 12847,
        todayPowerCore: 1234567,
        todayWisdomCrystal: 567890,
      });
    }, 500);
  });
}
```

**Step 2: Run Type Check**

Run: `cd amio-app && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add amio-app/src/utils/energyLogic.ts
git commit -m "feat(energy): add energy calculation utilities"
```

---

### Task 4: Create Planet Visualization Component

**Files:**
- Create: `amio-app/src/components/PlanetView/PlanetView.tsx`
- Create: `amio-app/src/components/PlanetView/index.scss`
- Create: `amio-app/src/components/PlanetView/index.ts`

**Step 1: Write Planet View Component**

```typescript
// PlanetView.tsx
import React from 'react';
import { View, Text } from '@tarojs/components';
import { getPlanetStage, STAGE_NAMES } from '../../utils/energyLogic';
import './index.scss';

interface PlanetViewProps {
  progress: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
}

const PlanetView: React.FC<PlanetViewProps> = ({
  progress,
  size = 'medium',
  showLabel = true,
  animated = true,
}) => {
  const stage = getPlanetStage(progress);

  const sizeClass = `planet--${size}`;
  const stageClass = `planet--${stage}`;
  const animateClass = animated ? 'planet--animated' : '';

  return (
    <View className={`planet-container ${sizeClass}`}>
      <View className={`planet ${stageClass} ${animateClass}`}>
        <View className="planet__surface">
          {stage === 'desolate' && <View className="planet__cracks" />}
          {(stage === 'sprout' || stage === 'construction') && (
            <View className="planet__vegetation" />
          )}
          {(stage === 'prosperity' || stage === 'launch' || stage === 'landing') && (
            <View className="planet__cities" />
          )}
          {(stage === 'launch' || stage === 'landing') && (
            <View className="planet__ring" />
          )}
        </View>
        <View className="planet__glow" />
        {animated && (
          <>
            <View className="planet__pulse" />
            <View className="planet__ai-bots">
              <View className="ai-bot ai-bot--1" />
              <View className="ai-bot ai-bot--2" />
              <View className="ai-bot ai-bot--3" />
            </View>
          </>
        )}
      </View>
      {showLabel && (
        <View className="planet-label">
          <Text className="planet-label__name">鲨之星</Text>
          <Text className="planet-label__stage">· 已苏醒 {progress.toFixed(1)}%</Text>
        </View>
      )}
    </View>
  );
};

export default PlanetView;
```

**Step 2: Write Planet Styles**

```scss
// index.scss
.planet-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

// Size variants
.planet--small {
  .planet {
    width: 80px;
    height: 80px;
  }
}

.planet--medium {
  .planet {
    width: 140px;
    height: 140px;
  }
}

.planet--large {
  .planet {
    width: 200px;
    height: 200px;
  }
}

// Base planet styles
.planet {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);

  &__surface {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: relative;
  }

  &__glow {
    position: absolute;
    top: -10%;
    left: -10%;
    right: -10%;
    bottom: -10%;
    border-radius: 50%;
    opacity: 0.4;
    filter: blur(20px);
    z-index: -1;
  }
}

// Stage visual variations
.planet--desolate {
  .planet__surface {
    background: linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%);
  }
  .planet__cracks {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
      linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.3) 49%, rgba(0,0,0,0.3) 51%, transparent 52%),
      linear-gradient(-45deg, transparent 48%, rgba(0,0,0,0.2) 49%, rgba(0,0,0,0.2) 51%, transparent 52%);
  }
  .planet__glow {
    background: radial-gradient(circle, rgba(100, 50, 50, 0.5) 0%, transparent 70%);
  }
}

.planet--sprout {
  .planet__surface {
    background: linear-gradient(135deg, #4a5a4a 0%, #3a4a3a 100%);
  }
  .planet__vegetation {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
      radial-gradient(circle at 30% 60%, rgba(100, 200, 100, 0.6) 0%, transparent 15%),
      radial-gradient(circle at 70% 40%, rgba(120, 220, 120, 0.5) 0%, transparent 12%),
      radial-gradient(circle at 50% 80%, rgba(100, 180, 100, 0.4) 0%, transparent 10%);
  }
  .planet__glow {
    background: radial-gradient(circle, rgba(100, 200, 100, 0.4) 0%, transparent 70%);
  }
}

.planet--construction {
  .planet__surface {
    background: linear-gradient(135deg, #4a5a6a 0%, #3a4a5a 100%);
  }
  .planet__vegetation {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
      radial-gradient(circle at 20% 30%, rgba(100, 200, 150, 0.5) 0%, transparent 20%),
      radial-gradient(circle at 60% 70%, rgba(150, 220, 200, 0.6) 0%, transparent 25%),
      radial-gradient(circle at 80% 40%, rgba(200, 240, 255, 0.4) 0%, transparent 15%);
  }
  .planet__glow {
    background: radial-gradient(circle, rgba(100, 200, 200, 0.5) 0%, transparent 70%);
  }
}

.planet--prosperity {
  .planet__surface {
    background: linear-gradient(135deg, #2a3a5a 0%, #1a2a4a 100%);
  }
  .planet__cities {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
      radial-gradient(circle at 25% 35%, rgba(255, 220, 150, 0.8) 0%, transparent 8%),
      radial-gradient(circle at 45% 55%, rgba(255, 200, 120, 0.7) 0%, transparent 6%),
      radial-gradient(circle at 65% 25%, rgba(255, 230, 180, 0.9) 0%, transparent 10%),
      radial-gradient(circle at 75% 65%, rgba(255, 210, 140, 0.6) 0%, transparent 7%),
      radial-gradient(circle at 35% 75%, rgba(255, 220, 160, 0.5) 0%, transparent 5%);
  }
  .planet__glow {
    background: radial-gradient(circle, rgba(255, 200, 100, 0.5) 0%, transparent 70%);
  }
}

.planet--launch {
  .planet__surface {
    background: linear-gradient(135deg, #3a3a5a 0%, #2a2a4a 100%);
  }
  .planet__cities {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
      radial-gradient(circle at 30% 40%, rgba(255, 230, 200, 0.9) 0%, transparent 10%),
      radial-gradient(circle at 50% 60%, rgba(255, 220, 180, 0.8) 0%, transparent 8%),
      radial-gradient(circle at 70% 30%, rgba(255, 240, 220, 1) 0%, transparent 12%);
  }
  .planet__ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 140%;
    height: 30%;
    transform: translate(-50%, -50%) rotate(-15deg);
    border: 3px solid rgba(255, 220, 150, 0.6);
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(255, 200, 100, 0.4);
  }
  .planet__glow {
    background: radial-gradient(circle, rgba(255, 220, 150, 0.6) 0%, transparent 70%);
  }
}

.planet--landing {
  .planet__surface {
    background: linear-gradient(135deg, #4a4a6a 0%, #3a3a5a 100%);
  }
  .planet__cities {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
      radial-gradient(circle at 20% 30%, rgba(255, 200, 255, 1) 0%, transparent 12%),
      radial-gradient(circle at 40% 50%, rgba(200, 255, 255, 0.9) 0%, transparent 10%),
      radial-gradient(circle at 60% 40%, rgba(255, 255, 200, 1) 0%, transparent 14%),
      radial-gradient(circle at 80% 60%, rgba(255, 220, 255, 0.9) 0%, transparent 11%);
  }
  .planet__ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 160%;
    height: 40%;
    transform: translate(-50%, -50%) rotate(-20deg);
    border: 4px solid rgba(255, 200, 255, 0.8);
    border-radius: 50%;
    box-shadow: 0 0 30px rgba(255, 180, 255, 0.6);
  }
  .planet__glow {
    background: radial-gradient(circle, rgba(255, 200, 255, 0.7) 0%, transparent 70%);
  }
}

// Animations
.planet--animated {
  .planet__pulse {
    position: absolute;
    top: -20%;
    left: -20%;
    right: -20%;
    bottom: -20%;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    animation: planet-pulse 3s ease-in-out infinite;
  }

  .planet__ai-bots {
    position: absolute;
    width: 100%;
    height: 100%;

    .ai-bot {
      position: absolute;
      width: 8px;
      height: 8px;
      background: rgba(100, 200, 255, 0.8);
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(100, 200, 255, 0.6);

      &--1 {
        top: 20%;
        left: 10%;
        animation: ai-float-1 4s ease-in-out infinite;
      }

      &--2 {
        top: 60%;
        right: 15%;
        animation: ai-float-2 5s ease-in-out infinite;
      }

      &--3 {
        bottom: 25%;
        left: 20%;
        animation: ai-float-3 6s ease-in-out infinite;
      }
    }
  }
}

@keyframes planet-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.1;
  }
}

@keyframes ai-float-1 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(20px, -10px); }
  50% { transform: translate(40px, 0); }
  75% { transform: translate(20px, 10px); }
}

@keyframes ai-float-2 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(-15px, 15px); }
  66% { transform: translate(-30px, 0); }
}

@keyframes ai-float-3 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(25px, -20px); }
}

// Label styles
.planet-label {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 4px;

  &__name {
    font-size: 16px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }

  &__stage {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
}
```

**Step 3: Create Index Export**

```typescript
// index.ts
export { default } from './PlanetView';
export type { PlanetViewProps } from './PlanetView';
```

**Step 4: Run Type Check**

Run: `cd amio-app && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add amio-app/src/components/PlanetView/
git commit -m "feat(planet): add planet visualization component with 6-stage evolution"
```

---

### Task 5: Create Personal Timeline Component

**Files:**
- Create: `amio-app/src/components/StarTrail/StarTrail.tsx`
- Create: `amio-app/src/components/StarTrail/index.scss`
- Create: `amio-app/src/components/StarTrail/index.ts`

**Step 1: Write StarTrail Component**

```typescript
// StarTrail.tsx
import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import type { Milestone } from '../../constants/game';
import './index.scss';

interface StarTrailProps {
  milestones: Milestone[];
  consecutiveDays: number;
}

const StarTrail: React.FC<StarTrailProps> = ({ milestones, consecutiveDays }) => {
  // Sort milestones: unlocked first (by date desc), then locked (by day asc)
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.unlockedAt && b.unlockedAt) {
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    }
    if (a.unlockedAt) return -1;
    if (b.unlockedAt) return 1;
    return a.day - b.day;
  });

  const getNextMilestone = () => {
    return sortedMilestones.find(m => !m.unlockedAt);
  };

  const nextMilestone = getNextMilestone();

  return (
    <View className="star-trail">
      <View className="star-trail__header">
        <Text className="star-trail__title">我的星轨</Text>
        <Text className="star-trail__subtitle">已连续点亮 {consecutiveDays} 天</Text>
      </View>

      <ScrollView className="star-trail__timeline" scrollY>
        <View className="timeline">
          {sortedMilestones.filter(m => m.unlockedAt).map((milestone, index) => (
            <View key={milestone.id} className="timeline__item timeline__item--unlocked">
              <View className="timeline__node">
                <Text className="timeline__icon">{milestone.icon}</Text>
                <View className="timeline__glow" />
              </View>
              <View className="timeline__content">
                <Text className="timeline__day">Day {milestone.day || '?'}</Text>
                <Text className="timeline__title">{milestone.title}</Text>
                <Text className="timeline__desc">{milestone.description}</Text>
                <Text className="timeline__date">{milestone.unlockedAt}</Text>
              </View>
              {index < sortedMilestones.filter(m => m.unlockedAt).length - 1 && (
                <View className="timeline__line" />
              )}
            </View>
          ))}

          {nextMilestone && (
            <View className="timeline__item timeline__item--next">
              <View className="timeline__node timeline__node--next">
                <Text className="timeline__icon">?</Text>
              </View>
              <View className="timeline__content">
                <Text className="timeline__day">Day {nextMilestone.day || '?'}</Text>
                <Text className="timeline__title">{nextMilestone.title}</Text>
                <Text className="timeline__desc">{nextMilestone.description}</Text>
                <Text className="timeline__hint">下一个里程碑等你解锁</Text>
              </View>
              <View className="timeline__line timeline__line--dashed" />
            </View>
          )}

          <View className="timeline__item timeline__item--locked">
            <View className="timeline__node timeline__node--locked">
              <Text className="timeline__icon">···</Text>
            </View>
            <View className="timeline__content">
              <Text className="timeline__title">更多成就等你发现</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default StarTrail;
```

**Step 2: Write StarTrail Styles**

```scss
// index.scss
.star-trail {
  padding: 16px;

  &__header {
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__title {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 4px;
  }

  &__subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
  }

  &__timeline {
    max-height: 400px;
  }
}

.timeline {
  position: relative;
  padding-left: 20px;

  &__item {
    position: relative;
    padding-bottom: 24px;
    display: flex;
    align-items: flex-start;
    gap: 16px;

    &--unlocked {
      .timeline__node {
        background: linear-gradient(135deg, #4a9eff 0%, #6a5af9 100%);
        box-shadow: 0 0 20px rgba(74, 158, 255, 0.4);
      }
    }

    &--next {
      .timeline__content {
        opacity: 0.8;
      }
    }

    &--locked {
      opacity: 0.4;
    }
  }

  &__node {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 2;
    position: relative;

    &--next {
      background: rgba(255, 255, 255, 0.1);
      border: 2px dashed rgba(255, 255, 255, 0.3);
    }

    &--locked {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  &__icon {
    font-size: 16px;
  }

  &__glow {
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    background: inherit;
    filter: blur(8px);
    opacity: 0.5;
    z-index: -1;
  }

  &__content {
    flex: 1;
    padding-top: 4px;
  }

  &__day {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 2px;
  }

  &__title {
    display: block;
    font-size: 15px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 4px;
  }

  &__desc {
    display: block;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }

  &__date {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
  }

  &__hint {
    font-size: 12px;
    color: #4a9eff;
    font-style: italic;
  }

  &__line {
    position: absolute;
    left: 18px;
    top: 36px;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, rgba(74, 158, 255, 0.4) 0%, rgba(74, 158, 255, 0.1) 100%);
    z-index: 1;

    &--dashed {
      background: repeating-linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.2) 0px,
        rgba(255, 255, 255, 0.2) 4px,
        transparent 4px,
        transparent 8px
      );
    }
  }
}
```

**Step 3: Create Index Export**

```typescript
// index.ts
export { default } from './StarTrail';
export type { StarTrailProps } from './StarTrail';
```

**Step 4: Run Type Check**

Run: `cd amio-app && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add amio-app/src/components/StarTrail/
git commit -m "feat(timeline): add personal star trail timeline component"
```

---

### Task 6: Create 3-Tab Navigation Structure

**Files:**
- Modify: `amio-app/src/app.config.ts:1-30`
- Create: `amio-app/src/pages/starlight/index.tsx`
- Create: `amio-app/src/pages/starlight/index.scss`
- Create: `amio-app/src/pages/starocean/index.tsx`
- Create: `amio-app/src/pages/starocean/index.scss`

**Step 1: Update App Config for Tab Navigation**

Modify `app.config.ts`:

```typescript
export default defineAppConfig({
  pages: [
    'pages/intro/index',
    'pages/starlight/index',   // New: Starlight Tab (main entry)
    'pages/starocean/index',   // New: Star Ocean Tab
    'pages/home/index',        // Becomes Star Trail Tab
    'pages/game/index',
  ],
  tabBar: {
    list: [
      {
        pagePath: 'pages/starlight/index',
        text: '星光',
        iconPath: 'assets/icons/starlight.png',
        selectedIconPath: 'assets/icons/starlight-active.png',
      },
      {
        pagePath: 'pages/starocean/index',
        text: '星海',
        iconPath: 'assets/icons/starocean.png',
        selectedIconPath: 'assets/icons/starocean-active.png',
      },
      {
        pagePath: 'pages/home/index',
        text: '星轨',
        iconPath: 'assets/icons/startrail.png',
        selectedIconPath: 'assets/icons/startrail-active.png',
      },
    ],
    color: '#666',
    selectedColor: '#4a9eff',
    backgroundColor: '#1a1a2e',
    borderStyle: 'black',
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTitleText: '鲨之星',
    navigationBarTextStyle: 'white',
  },
});
```

**Step 2: Create Starlight Tab Page**

```typescript
// pages/starlight/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import PlanetView from '../../components/PlanetView';
import { loadProgress, saveProgress } from '../../utils/storage';
import { calculatePowerCoreEnergy, syncPlanetProgress } from '../../utils/energyLogic';
import type { GameProgress } from '../../utils/storage';
import './index.scss';

const Starlight: React.FC = () => {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [planetProgress, setPlanetProgress] = useState(67.3);

  useEffect(() => {
    const loaded = loadProgress();
    setProgress(loaded);

    // Sync planet progress from server
    syncPlanetProgress().then(data => {
      setPlanetProgress(data.progress);
    });
  }, []);

  const handleLightUp = () => {
    if (progress?.todayCompleted) {
      // Go to hero mode
      Taro.navigateTo({ url: '/pages/game/index?mode=hero' });
    } else {
      // Go to normal game
      Taro.navigateTo({ url: '/pages/game/index?mode=normal' });
    }
  };

  const getButtonText = () => {
    if (!progress) return '点亮';
    if (progress.todayCompleted && progress.heroCompleted) return '明日再来点亮';
    if (progress.todayCompleted) return '挑战 Hero';
    return '点亮';
  };

  const isButtonDisabled = progress?.todayCompleted && progress?.heroCompleted;

  if (!progress) return null;

  return (
    <View className="starlight">
      {/* Top Status */}
      <View className="starlight__header">
        <View className="streak-badge">
          <Text className="streak-badge__icon">🔥</Text>
          <Text className="streak-badge__count">{progress.consecutiveDays}</Text>
        </View>
        <Text className="settings-icon">⚙️</Text>
      </View>

      {/* Planet Visualization */}
      <View className="starlight__planet">
        <PlanetView progress={planetProgress} size="large" />
      </View>

      {/* Chest Area */}
      <View className="starlight__chest">
        {progress.pendingChest ? (
          <View className="chest-card">
            <Text className="chest-card__label">✨ 来自星球的回馈</Text>
            <View className="chest-card__content">
              <Text className="chest-icon">🥇</Text>
              <Text className="chest-text">{progress.pendingChest.level}宝箱</Text>
              {progress.pendingChest.status === 'locked' && (
                <Text className="chest-timer">解锁倒计时...</Text>
              )}
            </View>
          </View>
        ) : (
          <Text className="encouragement">星球记得你的每一份光</Text>
        )}
      </View>

      {/* Main Action Button */}
      <View className="starlight__action">
        <View
          className={`light-button ${isButtonDisabled ? 'light-button--disabled' : ''}`}
          onClick={!isButtonDisabled ? handleLightUp : undefined}
        >
          <Text className="light-button__text">{getButtonText()}</Text>
          <View className="light-button__glow" />
        </View>
        <Text className="today-theme">今日主题：那个四块钱的球拍 🏓</Text>
      </View>
    </View>
  );
};

export default Starlight;
```

**Step 3: Write Starlight Styles**

```scss
// pages/starlight/index.scss
.starlight {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2a 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .streak-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 100, 50, 0.2);
      padding: 6px 12px;
      border-radius: 16px;

      &__icon {
        font-size: 14px;
      }

      &__count {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 200, 150, 0.9);
      }
    }

    .settings-icon {
      font-size: 20px;
      opacity: 0.6;
    }
  }

  &__planet {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  &__chest {
    margin-bottom: 24px;

    .chest-card {
      background: linear-gradient(135deg, rgba(255, 200, 100, 0.2) 0%, rgba(255, 150, 50, 0.1) 100%);
      border: 1px solid rgba(255, 200, 100, 0.3);
      border-radius: 12px;
      padding: 16px;
      text-align: center;

      &__label {
        display: block;
        font-size: 13px;
        color: rgba(255, 200, 150, 0.9);
        margin-bottom: 8px;
      }

      &__content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .chest-icon {
        font-size: 24px;
      }

      .chest-text {
        font-size: 16px;
        font-weight: 600;
        color: rgba(255, 220, 150, 0.95);
      }

      .chest-timer {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .encouragement {
      display: block;
      text-align: center;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.4);
      font-style: italic;
    }
  }

  &__action {
    padding-bottom: 40px;

    .light-button {
      position: relative;
      width: 200px;
      height: 56px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #4a9eff 0%, #6a5af9 100%);
      border-radius: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(74, 158, 255, 0.4);

      &--disabled {
        background: linear-gradient(135deg, #4a4a5a 0%, #3a3a4a 100%);
        box-shadow: none;
        opacity: 0.6;
      }

      &__text {
        font-size: 18px;
        font-weight: 600;
        color: white;
      }

      &__glow {
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        border-radius: 38px;
        background: inherit;
        filter: blur(20px);
        opacity: 0.3;
        animation: button-pulse 2s ease-in-out infinite;
        z-index: -1;
      }

      &:active:not(&--disabled) {
        transform: scale(0.98);
      }
    }

    .today-theme {
      display: block;
      text-align: center;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

@keyframes button-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}
```

**Step 4: Create Star Ocean Tab Page (Basic Structure)**

```typescript
// pages/starocean/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import PlanetView from '../../components/PlanetView';
import { syncPlanetProgress } from '../../utils/energyLogic';
import './index.scss';

const StarOcean: React.FC = () => {
  const [planetProgress, setPlanetProgress] = useState(67.3);
  const [activeUsers, setActiveUsers] = useState(12847);

  useEffect(() => {
    syncPlanetProgress().then(data => {
      setPlanetProgress(data.progress);
      setActiveUsers(data.activeUsers);
    });
  }, []);

  return (
    <View className="star-ocean">
      {/* Header */}
      <View className="star-ocean__header">
        <Text className="star-ocean__title">🌊 星海</Text>
        <Text className="star-ocean__notify">🔔</Text>
      </View>

      <ScrollView className="star-ocean__content" scrollY>
        {/* Planet Card */}
        <View className="planet-card">
          <PlanetView progress={planetProgress} size="small" />
          <View className="planet-card__stats">
            <Text className="stat">已苏醒 {planetProgress.toFixed(1)}%</Text>
            <Text className="stat">今日 {activeUsers.toLocaleString()} 人在线</Text>
            <Text className="stat">今日全服 +0.12%</Text>
          </View>
        </View>

        {/* Planet Ranking Placeholder */}
        <View className="section">
          <Text className="section__title">星际开发进度榜</Text>
          <ScrollView className="planet-rankings" scrollX>
            <View className="ranking-card ranking-card--current">
              <Text className="ranking-card__icon">🦈</Text>
              <Text className="ranking-card__rank">#1</Text>
              <Text className="ranking-card__name">鲨之星</Text>
              <Text className="ranking-card__progress">67.3%</Text>
            </View>
            <View className="ranking-card">
              <Text className="ranking-card__icon">🐟</Text>
              <Text className="ranking-card__rank">#2</Text>
              <Text className="ranking-card__name">鳗鱼星</Text>
              <Text className="ranking-card__progress">61.8%</Text>
            </View>
            <View className="ranking-card">
              <Text className="ranking-card__icon">🌙</Text>
              <Text className="ranking-card__rank">#3</Text>
              <Text className="ranking-card__name">月光星</Text>
              <Text className="ranking-card__progress">58.2%</Text>
            </View>
          </ScrollView>
        </View>

        {/* Community Feed Placeholder */}
        <View className="section">
          <Text className="section__title">社区动态</Text>
          <View className="feed-item">
            <Text className="feed-item__badge">📢</Text>
            <View className="feed-item__content">
              <Text className="feed-item__title">鲨之星今日突破67%！</Text>
              <Text className="feed-item__desc">距离下一个里程碑"飞船就绪"还需12.7%</Text>
            </View>
          </View>
          <View className="feed-item">
            <Text className="feed-item__avatar">🦈</Text>
            <View className="feed-item__content">
              <Text className="feed-item__author">鲨鱼小明</Text>
              <Text className="feed-item__text">今天Hero模式一把过！太爽了 🎉</Text>
              <View className="feed-item__actions">
                <Text>❤️ 234</Text>
                <Text>💬 56</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Post Button */}
      <View className="post-button">✏️</View>
    </View>
  );
};

export default StarOcean;
```

**Step 5: Write Star Ocean Styles**

```scss
// pages/starocean/index.scss
.star-ocean {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2a 100%);
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  &__notify {
    font-size: 20px;
    opacity: 0.6;
  }

  &__content {
    flex: 1;
    padding: 16px;
  }

  .planet-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;

    &__stats {
      flex: 1;

      .stat {
        display: block;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 6px;

        &:first-child {
          font-size: 18px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }
  }

  .section {
    margin-bottom: 24px;

    &__title {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 12px;
    }
  }

  .planet-rankings {
    white-space: nowrap;

    .ranking-card {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      margin-right: 12px;
      min-width: 100px;

      &--current {
        background: linear-gradient(135deg, rgba(74, 158, 255, 0.2) 0%, rgba(106, 90, 249, 0.2) 100%);
        border: 1px solid rgba(74, 158, 255, 0.3);
      }

      &__icon {
        font-size: 28px;
        margin-bottom: 8px;
      }

      &__rank {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 4px;
      }

      &__name {
        font-size: 14px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 4px;
      }

      &__progress {
        font-size: 16px;
        font-weight: 600;
        color: #4a9eff;
      }
    }
  }

  .feed-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    margin-bottom: 12px;

    &__badge,
    &__avatar {
      font-size: 24px;
      flex-shrink: 0;
    }

    &__content {
      flex: 1;
    }

    &__title {
      display: block;
      font-size: 15px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 4px;
    }

    &__author {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 4px;
    }

    &__desc,
    &__text {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
    }

    &__actions {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
    }
  }

  .post-button {
    position: fixed;
    right: 20px;
    bottom: 100px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #4a9eff 0%, #6a5af9 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 4px 20px rgba(74, 158, 255, 0.4);
  }
}
```

**Step 6: Run Type Check**

Run: `cd amio-app && npx tsc --noEmit`
Expected: PASS

**Step 7: Commit**

```bash
git add amio-app/src/app.config.ts amio-app/src/pages/starlight/ amio-app/src/pages/starocean/
git commit -m "feat(navigation): add 3-tab structure with Starlight and Star Ocean pages"
```

---

### Task 7: Refactor Home Page to Star Trail Tab

**Files:**
- Modify: `amio-app/src/pages/home/index.tsx`
- Modify: `amio-app/src/pages/home/index.scss`

**Step 1: Update Home Page to Star Trail Design**

```typescript
// pages/home/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import StarTrail from '../../components/StarTrail';
import { loadProgress } from '../../utils/storage';
import { calculateTotalContribution, determineLandingBatch } from '../../utils/energyLogic';
import type { GameProgress } from '../../utils/storage';
import './index.scss';

const Home: React.FC = () => {
  const [progress, setProgress] = useState<GameProgress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) return null;

  const totalContrib = calculateTotalContribution(progress.energy);
  const landingBatch = determineLandingBatch(progress.ranking.percentile);

  const batchNames: Record<string, string> = {
    pioneer: '首批先驱者',
    early_pioneer: '早期开拓者',
    builder: '建设者',
    resident: '普通居民',
  };

  return (
    <View className="star-trail-page">
      <ScrollView className="star-trail-page__content" scrollY>
        {/* Identity Card */}
        <View className="identity-card">
          <View className="identity-card__header">
            <View className="identity-card__avatar">
              <Text>🦈</Text>
            </View>
            <View className="identity-card__info">
              <Text className="identity-card__name">鲨鱼用户</Text>
              <Text className="identity-card__title">{batchNames[landingBatch]}</Text>
            </View>
          </View>
          <View className="identity-card__priority">
            <Text className="priority-label">🚀 登陆优先级</Text>
            <View className="priority-value">
              <Text className="priority-percent">前 {progress.ranking.percentile}%</Text>
              <Text className="priority-rank">· #{progress.ranking.globalRank}</Text>
            </View>
          </View>
        </View>

        {/* Energy Cards */}
        <View className="energy-cards">
          <View className="energy-card energy-card--power">
            <Text className="energy-card__label">⚡ 动力核心</Text>
            <Text className="energy-card__value">{progress.energy.powerCore.toLocaleString()}</Text>
            <Text className="energy-card__rank">全服Top {progress.ranking.percentile}%</Text>
            <Text className="energy-card__weekly">本周 +2,340</Text>
          </View>
          <View className="energy-card energy-card--wisdom">
            <Text className="energy-card__label">💡 算力晶体</Text>
            <Text className="energy-card__value">{progress.energy.wisdomCrystal.toLocaleString()}</Text>
            <Text className="energy-card__rank">全服Top 8.7%</Text>
            <Text className="energy-card__weekly">本周 +890</Text>
          </View>
        </View>

        {/* Status Quick View */}
        <View className="status-bar">
          <View className="status-item">
            <Text className="status-item__label">📅 连续点亮</Text>
            <Text className="status-item__value">{progress.consecutiveDays}天</Text>
          </View>
          <View className="status-item">
            <Text className="status-item__label">🎯 本周</Text>
            <Text className="status-item__value">4/5</Text>
          </View>
        </View>

        {/* Star Trail Timeline */}
        <StarTrail milestones={progress.milestones} consecutiveDays={progress.consecutiveDays} />

        {/* Achievement Wall Placeholder */}
        <View className="section">
          <Text className="section__title">🏅 成就墙</Text>
          <View className="achievement-wall">
            {progress.titles.slice(0, 5).map((title, i) => (
              <View key={i} className="achievement-badge">
                <Text>{title.icon}</Text>
                <Text className="achievement-badge__name">{title.name}</Text>
              </View>
            ))}
            <View className="achievement-badge achievement-badge--more">
              <Text>+3</Text>
            </View>
          </View>
        </View>

        {/* Footer Links */}
        <View className="footer-links">
          <Text className="footer-link">⚙️ 设置</Text>
          <Text className="footer-link">📜 历史贡献</Text>
          <Text className="footer-link">❓ 帮助</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;
```

**Step 2: Update Home Page Styles**

```scss
// pages/home/index.scss
.star-trail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2a 100%);

  &__content {
    padding: 20px;
  }

  .identity-card {
    background: linear-gradient(135deg, rgba(74, 158, 255, 0.15) 0%, rgba(106, 90, 249, 0.1) 100%);
    border: 1px solid rgba(74, 158, 255, 0.2);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;

    &__header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    &__avatar {
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }

    &__info {
      flex: 1;
    }

    &__name {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 4px;
    }

    &__title {
      font-size: 14px;
      color: #4a9eff;
      background: rgba(74, 158, 255, 0.15);
      padding: 4px 12px;
      border-radius: 12px;
    }

    &__priority {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 16px;
    }

    .priority-label {
      display: block;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 4px;
    }

    .priority-value {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .priority-percent {
      font-size: 28px;
      font-weight: 700;
      color: #ffd700;
    }

    .priority-rank {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .energy-cards {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;

    .energy-card {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;

      &--power {
        border-left: 3px solid #4a9eff;
      }

      &--wisdom {
        border-left: 3px solid #ffd700;
      }

      &__label {
        display: block;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 8px;
      }

      &__value {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: 4px;
      }

      &__rank {
        display: block;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 8px;
      }

      &__weekly {
        font-size: 12px;
        color: #4ade80;
      }
    }
  }

  .status-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;

    .status-item {
      flex: 1;

      &__label {
        display: block;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 2px;
      }

      &__value {
        font-size: 15px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }

  .section {
    margin-bottom: 20px;

    &__title {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 12px;
    }
  }

  .achievement-wall {
    display: flex;
    gap: 12px;
    overflow-x: auto;

    .achievement-badge {
      width: 64px;
      height: 64px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;

      &__name {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 4px;
      }

      &--more {
        background: rgba(255, 255, 255, 0.03);
        font-size: 14px;
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }

  .footer-links {
    display: flex;
    justify-content: center;
    gap: 24px;
    padding: 20px 0 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    margin-top: 20px;

    .footer-link {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
}
```

**Step 3: Run Type Check**

Run: `cd amio-app && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add amio-app/src/pages/home/
git commit -m "feat(startrail): refactor home page to Star Trail tab with identity and energy cards"
```

---

### Task 8: Integrate Energy System with Game Completion

**Files:**
- Modify: `amio-app/src/pages/game/index.tsx:200-300`
- Modify: `amio-app/src/utils/storage.ts:200-300`

**Step 1: Add Energy Update Function**

Add to `storage.ts`:

```typescript
import { calculatePowerCoreEnergy, calculateTotalContribution } from './energyLogic';

// Update energy after game completion
export function updateEnergyAfterGame(
  mode: GameMode,
  chestLevel: ChestLevel,
  consecutiveDays: number
): void {
  const progress = loadProgress();

  // Calculate power core earned
  const powerCoreEarned = calculatePowerCoreEnergy(mode, chestLevel, consecutiveDays);

  // Update energy
  progress.energy.powerCore += powerCoreEarned;
  progress.energy.totalContribution = calculateTotalContribution(progress.energy);

  // Add to daily history
  const today = new Date().toISOString().split('T')[0];
  const existingEntry = progress.dailyEnergyHistory.find(e => e.date === today);

  if (existingEntry) {
    existingEntry.powerCore += powerCoreEarned;
  } else {
    progress.dailyEnergyHistory.push({
      date: today,
      powerCore: powerCoreEarned,
      wisdomCrystal: 0,
    });
  }

  // Check and update milestones
  checkMilestones(progress);

  saveProgress(progress);
}

// Check and unlock milestones
function checkMilestones(progress: GameProgress): void {
  const today = new Date().toISOString().split('T')[0];

  progress.milestones.forEach(milestone => {
    if (milestone.unlockedAt) return;

    let shouldUnlock = false;

    switch (milestone.id) {
      case 'first_light':
        shouldUnlock = progress.totalDaysPlayed >= 1;
        break;
      case 'week_warrior':
        shouldUnlock = progress.consecutiveDays >= 7;
        break;
      case 'month_master':
        shouldUnlock = progress.consecutiveDays >= 30;
        break;
      case 'first_hero':
        shouldUnlock = progress.heroCompleted;
        break;
      case 'diamond_hunter':
        shouldUnlock = progress.todayChestLevel === ChestLevel.DIAMOND;
        break;
      case 'contrib_1k':
        shouldUnlock = progress.energy.totalContribution >= 1000;
        break;
      case 'contrib_10k':
        shouldUnlock = progress.energy.totalContribution >= 10000;
        break;
    }

    if (shouldUnlock) {
      milestone.unlockedAt = today;
    }
  });
}

// Update wisdom crystal (for social actions)
export function addWisdomCrystal(amount: number): void {
  const progress = loadProgress();

  progress.energy.wisdomCrystal += amount;
  progress.energy.totalContribution = calculateTotalContribution(progress.energy);

  // Add to daily history
  const today = new Date().toISOString().split('T')[0];
  const existingEntry = progress.dailyEnergyHistory.find(e => e.date === today);

  if (existingEntry) {
    existingEntry.wisdomCrystal += amount;
  } else {
    progress.dailyEnergyHistory.push({
      date: today,
      powerCore: 0,
      wisdomCrystal: amount,
    });
  }

  checkMilestones(progress);
  saveProgress(progress);
}
```

**Step 2: Update Game Page to Track Energy**

In `game/index.tsx`, update the win handler:

```typescript
// Around line 250-280 where win condition is handled
const handleWin = () => {
  setStatus('won');

  const progress = loadProgress();

  // Calculate chest level based on attempts and tools
  const chestLevel = calculateChestLevel(gameStats);
  const finalChestLevel = mode === GameMode.HERO
    ? upgradeChestForHero(chestLevel)
    : chestLevel;

  // Mark completion
  if (mode === GameMode.HERO) {
    progress.heroCompleted = true;
    progress.heroAttempted = true;
  } else {
    progress.todayCompleted = true;
    progress.todayChestLevel = finalChestLevel;
    progress.totalDaysPlayed += 1;

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    if (progress.lastCompletionDate) {
      const lastDate = new Date(progress.lastCompletionDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        progress.consecutiveDays += 1;
      } else if (diffDays > 1) {
        progress.consecutiveDays = 1;
      }
    } else {
      progress.consecutiveDays = 1;
    }
    progress.lastCompletionDate = today;
  }

  saveProgress(progress);

  // Update energy (this is the new integration)
  updateEnergyAfterGame(mode, finalChestLevel, progress.consecutiveDays);

  // Show story modal first, then chest modal
  setShowStoryModal(true);
};
```

**Step 3: Run Type Check**

Run: `cd amio-app && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add amio-app/src/utils/storage.ts amio-app/src/pages/game/index.tsx
git commit -m "feat(integration): connect energy system to game completion and milestone tracking"
```

---

### Task 9: Add Tab Bar Icons

**Files:**
- Create placeholder icons in `amio-app/src/assets/icons/`

**Step 1: Create Icon Placeholders**

Since we don't have actual icon assets, create a simple SVG generator script or use emoji placeholders:

```typescript
// Update app.config.ts to use emoji as temporary icons
export default defineAppConfig({
  // ...
  tabBar: {
    list: [
      {
        pagePath: 'pages/starlight/index',
        text: '星光',
        // Using text-based icons temporarily
      },
      {
        pagePath: 'pages/starocean/index',
        text: '星海',
      },
      {
        pagePath: 'pages/home/index',
        text: '星轨',
      },
    ],
    // ...
  },
});
```

Actually, Taro requires actual image files for tabBar icons. Create simple colored squares as placeholders:

```bash
cd amio-app/src/assets
mkdir -p icons
```

Create placeholder PNG files (or use base64 data URLs in a real scenario).

For now, let's create a simple index file that exports the paths:

```typescript
// assets/icons/index.ts
// Placeholder - in real implementation, these would be actual PNG files
export const ICONS = {
  starlight: require('./starlight.png'),
  starlightActive: require('./starlight-active.png'),
  starocean: require('./starocean.png'),
  staroceanActive: require('./starocean-active.png'),
  startrail: require('./startrail.png'),
  startrailActive: require('./startrail-active.png'),
};
```

**Step 2: Create Simple SVG Icons and Convert**

Create SVG files and then convert them to PNG. For this plan, document what icons are needed:

```markdown
Icon Requirements:
- starlight.png / starlight-active.png: Star/light themed icon
- starocean.png / starocean-active.png: Wave/ocean themed icon
- startrail.png / startrail-active.png: Orbit/path themed icon

Size: 81x81px (standard Taro tabBar icon size)
Format: PNG with transparency
```

**Step 3: Commit**

```bash
git add amio-app/src/assets/icons/
git commit -m "chore(assets): add tab bar icon placeholders"
```

---

### Task 10: Add Global Styles and Theme

**Files:**
- Modify: `amio-app/src/app.scss`

**Step 1: Add Global Theme Variables**

```scss
// app.scss
// Global theme for Shark Star

// Color palette
:root {
  --color-bg-primary: #0a0a1a;
  --color-bg-secondary: #1a1a3e;
  --color-bg-tertiary: #0f0f2a;

  --color-accent: #4a9eff;
  --color-accent-glow: rgba(74, 158, 255, 0.4);
  --color-gold: #ffd700;
  --color-gold-glow: rgba(255, 215, 0, 0.4);

  --color-text-primary: rgba(255, 255, 255, 0.95);
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-tertiary: rgba(255, 255, 255, 0.5);
  --color-text-muted: rgba(255, 255, 255, 0.3);

  --color-border: rgba(255, 255, 255, 0.1);

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}

// Global resets
page {
  background: linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 50%, var(--color-bg-tertiary) 100%);
  min-height: 100vh;
  color: var(--color-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// Scrollbar styling
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

// Utility classes
.text-center { text-align: center; }
.text-right { text-align: right; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 4px; }
.gap-8 { gap: 8px; }
.gap-16 { gap: 16px; }

// Animation utilities
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.4s ease-out;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

**Step 2: Run Dev Server to Test**

Run: `cd amio-app && npm run dev:h5`
Expected: Server starts on localhost:10086

**Step 3: Commit**

```bash
git add amio-app/src/app.scss
git commit -m "feat(theme): add global theme variables and utility classes"
```

---

### Task 11: Update Intro Page Navigation

**Files:**
- Modify: `amio-app/src/pages/intro/index.tsx:80-120`

**Step 1: Update Navigation Target**

Change the intro completion navigation from home to starlight:

```typescript
// In intro page completion handler
const handleComplete = () => {
  const progress = loadProgress();
  progress.hasSeenIntro = true;
  saveProgress(progress);

  // Navigate to Starlight tab (main entry point)
  Taro.switchTab({ url: '/pages/starlight/index' });
};
```

**Step 2: Commit**

```bash
git add amio-app/src/pages/intro/index.tsx
git commit -m "fix(intro): update navigation to new Starlight tab"
```

---

### Task 12: Build and Verify

**Files:**
- All modified files

**Step 1: Type Check**

Run: `cd amio-app && npx tsc --noEmit`
Expected: PASS with no errors

**Step 2: Build for Production**

Run: `cd amio-app && npm run build:h5`
Expected: Build completes successfully

**Step 3: Run Tests**

Run: `cd amio-app && npm test`
Expected: All tests pass (or no tests to run)

**Step 4: Final Commit**

```bash
git add .
git commit -m "feat(shark-star): complete world development system implementation

- Add dual energy system (power core + wisdom crystal)
- Implement 3-tab navigation (Starlight/Star Ocean/Star Trail)
- Create planet visualization with 6-stage evolution
- Add personal star trail timeline with milestones
- Integrate energy tracking with game completion
- Add global theme and styling"
```

---

## Verification Checklist

Before marking complete, verify:

- [ ] App starts without errors (`npm run dev:h5`)
- [ ] 3-tab navigation works correctly
- [ ] Starlight tab shows planet visualization
- [ ] "点亮" button navigates to game
- [ ] Game completion updates energy and milestones
- [ ] Star Trail tab shows identity card and energy stats
- [ ] Timeline displays milestones correctly
- [ ] Planet visual changes based on progress
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] Build completes successfully

---

## Post-Implementation Notes

### P2 Features (Future Tasks)

These features were not included in the initial implementation:

1. **User Posts + Interactions**: Community posting, liking, commenting
2. **Real Planet Sync**: Replace mock data with actual server API
3. **Achievement Detail Page**: Full achievement list with unlock conditions
4. **Energy History Charts**: Daily/weekly/monthly contribution graphs
5. **Inter-Planet Competition**: Real rankings from other fan communities
6. **Milestone Event Animations**: Full-screen celebrations for major milestones

### Data Migration Strategy

Existing users will have their data automatically migrated when they open the app:
- New energy fields initialized to 0
- Milestones reset to default (will unlock based on existing progress)
- Planet progress starts at mock value (will sync from server)

### Server Integration Points

The following functions need server API integration:
- `syncPlanetProgress()` - Get global planet progress
- `updateRanking()` - Update user ranking percentile
- `fetchCommunityFeed()` - Get community posts
- `createPost()` - Submit user post

These are currently mocked and should be replaced with actual API calls.
