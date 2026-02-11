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

import { preferenceStore } from '@/services/preference-store';

describe('services/preference-store', () => {
  beforeEach(() => {
    preferenceStore.clear();
  });

  test('save and list preferences', () => {
    preferenceStore.save({
      userId: 'local-user',
      date: '2026-02-11',
      gameType: 'sudoku',
      feedback: 'liked',
    });

    const records = preferenceStore.listByUser('local-user');
    expect(records).toHaveLength(1);
    expect(records[0].feedback).toBe('liked');
  });

  test('save updates same date/game record', () => {
    preferenceStore.save({
      userId: 'local-user',
      date: '2026-02-11',
      gameType: 'sudoku',
      feedback: 'liked',
    });
    preferenceStore.save({
      userId: 'local-user',
      date: '2026-02-11',
      gameType: 'sudoku',
      feedback: 'disliked',
    });

    const records = preferenceStore.listByUser('local-user');
    expect(records).toHaveLength(1);
    expect(records[0].feedback).toBe('disliked');
  });
});
