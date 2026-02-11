import { defineFeature, loadFeature } from 'jest-cucumber';
import { GameScheduler } from '@/engine/game-scheduler';
import {
  advanceDebugDateByDays,
  getTodayDateString,
  setDebugDateOffsetDays,
} from '@/utils/storage';
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

const feature = loadFeature('__tests__/features/engine/debug-next-day-scheduler.feature');

defineFeature(feature, (test) => {
  test('Next-day debug advance switches effective day and game type', ({ given, when, then }) => {
    const scheduler = new GameScheduler();
    let firstDate = '';
    let secondDate = '';
    let firstGame = '';
    let secondGame = '';

    given('today is fixed and debug offset is zero', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-11T10:00:00.000Z'));
      setDebugDateOffsetDays(0);
    });

    when('I advance debug day by one', () => {
      firstDate = getTodayDateString();
      firstGame = scheduler.getTodayGameType('local-user', firstDate);

      advanceDebugDateByDays(1);

      secondDate = getTodayDateString();
      secondGame = scheduler.getTodayGameType('local-user', secondDate);
    });

    then('effective date and scheduled game type should both change', () => {
      expect(firstDate).toBe('2026-02-11');
      expect(secondDate).toBe('2026-02-12');
      expect(firstGame).not.toBe(secondGame);
      jest.useRealTimers();
    });
  });
});
