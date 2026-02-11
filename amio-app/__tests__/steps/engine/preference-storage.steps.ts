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

import { preferenceStore } from '@/services/preference-store';

const feature = loadFeature('__tests__/features/engine/preference-storage.feature');

defineFeature(feature, (test) => {
  test('Preference feedback persistence supports liked, disliked, and skipped', ({ given, when, then }) => {
    let values: string[] = [];

    given('an empty preference store', () => {
      preferenceStore.clear();
      values = [];
    });

    when('I save liked disliked and skipped records', () => {
      preferenceStore.save({ userId: 'u1', date: '2026-02-09', gameType: '3tiles', feedback: 'liked' });
      preferenceStore.save({ userId: 'u1', date: '2026-02-10', gameType: 'sudoku', feedback: 'disliked' });
      preferenceStore.save({ userId: 'u1', date: '2026-02-11', gameType: '3tiles', feedback: 'skipped' });
      values = preferenceStore.listByUser('u1').map((item) => item.feedback).sort();
    });

    then('all feedback values should be retrievable', () => {
      expect(values).toEqual(['disliked', 'liked', 'skipped']);
    });
  });
});
