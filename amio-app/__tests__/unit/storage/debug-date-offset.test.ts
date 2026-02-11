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

import {
  advanceDebugDateByDays,
  getTodayDateString,
  setDebugDateOffsetDays,
} from '@/utils/storage';
import { GameScheduler } from '@/engine/game-scheduler';

describe('storage/debug-date-offset', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-11T10:00:00.000Z'));
    setDebugDateOffsetDays(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('getTodayDateString reflects debug date offset', () => {
    expect(getTodayDateString()).toBe('2026-02-11');

    advanceDebugDateByDays(1);
    expect(getTodayDateString()).toBe('2026-02-12');
  });

  test('scheduler alternates game type after debug next-day advance', () => {
    const scheduler = new GameScheduler();

    const day1 = getTodayDateString();
    const game1 = scheduler.getTodayGameType('local-user', day1);

    advanceDebugDateByDays(1);

    const day2 = getTodayDateString();
    const game2 = scheduler.getTodayGameType('local-user', day2);

    expect(day1).toBe('2026-02-11');
    expect(day2).toBe('2026-02-12');
    expect(game1).not.toBe(game2);
  });
});
