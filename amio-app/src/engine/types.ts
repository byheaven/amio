export type EngineGameMode = 'normal' | 'hero';

export type EngineGameStatus = 'idle' | 'playing' | 'cleared' | 'failed' | 'quit';

export interface GameAction {
  type: string;
  payload?: Record<string, unknown>;
}

export interface GameConfig {
  mode: EngineGameMode;
  date: string;
  seed?: number;
  userId?: string;
}

export interface GameState {
  status: EngineGameStatus;
  startedAt: number;
  endedAt?: number;
  attempts: number;
  toolsUsed: number;
}

export interface PerformanceMetrics {
  efficiencyScore: number;
  toolsUsed: number;
  rawData: Record<string, unknown>;
}

export type FeedbackValue = 'liked' | 'disliked' | 'skipped';

export interface GameResult {
  gameId: string;
  mode: EngineGameMode;
  status: Extract<EngineGameStatus, 'cleared' | 'failed' | 'quit'>;
  attempts: number;
  durationSeconds: number;
  toolsUsed: number;
  heroAttempted: boolean;
  heroResult?: 'cleared' | 'failed';
  feedback?: FeedbackValue;
}

export interface SettlementPayload {
  result: GameResult;
  chestLevel: 'diamond' | 'gold' | 'silver' | 'bronze';
  performance: PerformanceMetrics;
}

export interface GameTool {
  id: string;
  name: string;
  description: string;
  freeUses: number;
}

export interface HeroConfig {
  enabled: boolean;
  mode: EngineGameMode;
  timeLimitSeconds?: number;
  description: string;
}

export interface RatingTier {
  minEfficiencyScore: number;
  maxToolsUsed: number;
}

export interface RatingConfig {
  diamond: RatingTier;
  gold: RatingTier;
  silver: RatingTier;
}

export type RatedChestLevel = 'diamond' | 'gold' | 'silver' | 'bronze';
