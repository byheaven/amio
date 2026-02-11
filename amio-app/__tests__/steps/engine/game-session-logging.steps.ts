import { defineFeature, loadFeature } from 'jest-cucumber';
import '../../helpers/bdd-setup';

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

import { gameLogger } from '@/services/game-logger';

const feature = loadFeature('__tests__/features/engine/game-session-logging.feature');

defineFeature(feature, (test) => {
  test('Log one record per completed or failed game', ({ given, when, then }) => {
    let resultCount = 0;

    given('a game logger with empty storage', () => {
      gameLogger.clear();
    });

    when('I append completed and failed sessions', () => {
      gameLogger.append({
        userId: 'local-user',
        date: '2026-02-11',
        gameType: '3tiles',
        mode: 'normal',
        result: 'cleared',
        attempts: 1,
        durationSeconds: 90,
        toolsUsed: 0,
        chestLevel: 'diamond',
        heroAttempted: false,
      });
      gameLogger.append({
        userId: 'local-user',
        date: '2026-02-11',
        gameType: 'sudoku',
        mode: 'hero',
        result: 'failed',
        attempts: 1,
        durationSeconds: 180,
        toolsUsed: 1,
        chestLevel: 'bronze',
        heroAttempted: true,
      });

      resultCount = gameLogger.listByUser('local-user').length;
    });

    then('both sessions should be persisted for the user', () => {
      expect(resultCount).toBe(2);
    });
  });
});
