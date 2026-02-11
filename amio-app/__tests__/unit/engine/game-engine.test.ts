const storage: Record<string, string> = {};

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    setStorageSync: (key: string, value: string) => {
      storage[key] = value;
    },
    getStorageSync: (key: string) => storage[key],
    removeStorageSync: (key: string) => {
      delete storage[key];
    },
  },
}));

import { GameEngine } from '@/engine/game-engine';
import { gameRegistry } from '@/engine/game-registry';
import { createMockPlugin } from '../../helpers/plugin-factory';
import { gameLogger } from '@/services/game-logger';

describe('engine/game-engine', () => {
  test('runs game and creates settlement payload', () => {
    const plugin = createMockPlugin('engine');
    gameRegistry.register(plugin);

    const engine = new GameEngine();
    engine.setGame('engine');
    engine.startGame({ mode: 'normal', date: '2026-02-11', userId: 'local-user' });
    engine.dispatch({ type: 'win' });

    const payload = engine.onGameEnd({
      gameId: 'engine',
      mode: 'normal',
      status: 'cleared',
      attempts: 1,
      durationSeconds: 10,
      toolsUsed: 0,
      heroAttempted: false,
      feedback: 'liked',
    });

    expect(payload.chestLevel).toBe('diamond');
    expect(gameLogger.listByUser('local-user').length).toBeGreaterThan(0);
  });
});
