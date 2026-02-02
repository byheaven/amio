import { ChestLevel, GameMode } from '../constants/game';
import type { EnergyContribution } from '../constants/game';

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
