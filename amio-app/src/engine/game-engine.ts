import { ChestLevel } from '@/constants/game';
import {
  EngineGameMode,
  GameAction,
  GameConfig,
  GameResult,
  GameState,
  SettlementPayload,
} from '@/engine/types';
import { chestRatingEngine } from '@/engine/chest-rating';
import { gameRegistry } from '@/engine/game-registry';
import { gameScheduler } from '@/engine/game-scheduler';
import { gameLogger } from '@/services/game-logger';
import { preferenceStore } from '@/services/preference-store';
import { GamePlugin } from '@/types/game-plugin';

const mapChestLevel = (level: 'diamond' | 'gold' | 'silver' | 'bronze'): ChestLevel => {
  switch (level) {
    case 'diamond':
      return ChestLevel.DIAMOND;
    case 'gold':
      return ChestLevel.GOLD;
    case 'silver':
      return ChestLevel.SILVER;
    default:
      return ChestLevel.BRONZE;
  }
};

export class GameEngine<TState extends GameState = GameState> {
  private activePlugin: GamePlugin<TState> | null = null;
  private activeState: TState | null = null;
  private mode: EngineGameMode = 'normal';
  private userId = 'local-user';
  private date = '';

  getTodayGame(userId: string, date: string): GamePlugin {
    const gameType = gameScheduler.getTodayGameType(userId, date);
    return gameRegistry.get(gameType);
  }

  setGame(gameId: string): void {
    this.activePlugin = gameRegistry.get(gameId) as GamePlugin<TState>;
  }

  startGame(config: GameConfig): TState {
    if (!this.activePlugin) {
      const plugin = this.getTodayGame(config.userId || 'local-user', config.date);
      this.activePlugin = plugin as GamePlugin<TState>;
    }

    this.mode = config.mode;
    this.userId = config.userId || 'local-user';
    this.date = config.date;
    this.activeState = this.activePlugin.initGame(config);
    return this.activeState;
  }

  dispatch(action: GameAction): TState {
    if (!this.activePlugin || !this.activeState) {
      throw new Error('Game is not started');
    }

    this.activeState = this.activePlugin.handleAction(this.activeState, action);
    return this.activeState;
  }

  useTool(toolId: string): TState {
    if (!this.activePlugin || !this.activeState) {
      throw new Error('Game is not started');
    }

    this.activeState = this.activePlugin.useTool(this.activeState, toolId);
    return this.activeState;
  }

  getStatus(): string {
    if (!this.activePlugin || !this.activeState) {
      return 'idle';
    }
    return this.activePlugin.getStatus(this.activeState);
  }

  getState(): TState | null {
    return this.activeState;
  }

  enterSettlement(result: GameResult): SettlementPayload {
    if (!this.activePlugin || !this.activeState) {
      throw new Error('Game is not started');
    }

    const performance = this.activePlugin.getPerformance(this.activeState);
    const ratedLevel = chestRatingEngine.rate(performance, this.activePlugin.ratingConfig);

    return {
      result,
      chestLevel: ratedLevel,
      performance,
    };
  }

  onGameEnd(result: GameResult): SettlementPayload {
    const payload = this.enterSettlement(result);

    gameLogger.append({
      userId: this.userId,
      date: this.date,
      gameType: result.gameId,
      mode: this.mode,
      result: result.status,
      attempts: result.attempts,
      durationSeconds: result.durationSeconds,
      toolsUsed: result.toolsUsed,
      chestLevel: payload.chestLevel,
      heroAttempted: result.heroAttempted,
      heroResult: result.heroResult,
      feedback: result.feedback,
    });

    if (result.feedback) {
      preferenceStore.save({
        userId: this.userId,
        date: this.date,
        gameType: result.gameId,
        feedback: result.feedback,
      });
    }

    return payload;
  }

  getChestLevelAsEnum(level: 'diamond' | 'gold' | 'silver' | 'bronze'): ChestLevel {
    return mapChestLevel(level);
  }
}

export const gameEngine = new GameEngine();
