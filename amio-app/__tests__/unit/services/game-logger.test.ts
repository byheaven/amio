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

describe('services/game-logger', () => {
  beforeEach(() => {
    gameLogger.clear();
  });

  test('append and filter logs by user', () => {
    gameLogger.append({
      userId: 'u1',
      date: '2026-02-11',
      gameType: '3tiles',
      mode: 'normal',
      result: 'cleared',
      attempts: 1,
      durationSeconds: 20,
      toolsUsed: 0,
      chestLevel: 'diamond',
      heroAttempted: false,
    });
    gameLogger.append({
      userId: 'u2',
      date: '2026-02-11',
      gameType: 'sudoku',
      mode: 'normal',
      result: 'failed',
      attempts: 1,
      durationSeconds: 33,
      toolsUsed: 1,
      chestLevel: 'bronze',
      heroAttempted: false,
    });

    expect(gameLogger.listByUser('u1')).toHaveLength(1);
    expect(gameLogger.listByUser('u2')[0].result).toBe('failed');
  });
});
