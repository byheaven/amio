import { GameStats } from '@/constants/game';

/**
 * Create a GameStats object with default values and optional overrides
 */
export function createGameStats(overrides: Partial<GameStats> = {}): GameStats {
  return {
    attempts: 1,
    toolsUsed: 0,
    undoUsed: false,
    shuffleUsed: false,
    popUsed: false,
    ...overrides,
  };
}
