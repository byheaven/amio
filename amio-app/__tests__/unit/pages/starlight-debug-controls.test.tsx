import React from 'react';
import { act, render } from '@tarojs/test-utils-react/dist/pure';

const mockNavigateTo = jest.fn();
const mockClearStorageSync = jest.fn();
const mockUseDidShow = jest.fn();
const mockAdvanceDebugDateByDays = jest.fn();
const mockSavePreference = jest.fn();

const mockGetTodayDateString = jest.fn(() => '2026-02-11');

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    navigateTo: (...args: unknown[]) => mockNavigateTo(...args),
    clearStorageSync: (...args: unknown[]) => mockClearStorageSync(...args),
  },
  useDidShow: (...args: unknown[]) => mockUseDidShow(...args),
}));

jest.mock('@/components/PlanetView', () => () => null);
jest.mock('@/components/TodayGameCard', () => () => null);
jest.mock('@/components/PreferenceFeedback', () => () => null);
jest.mock('@/components/StreakMilestones', () => () => null);

jest.mock('@/engine/game-engine', () => ({
  GameEngine: class {
    getTodayGame(_userId: string, date: string) {
      return {
        id: date === '2026-02-11' ? 'sudoku' : '3tiles',
        meta: {
          id: 'sudoku',
          narrativeName: 'Star Chart Decode',
          narrativeDesc: 'desc',
          icon: '🔮',
          thumbnailComponent: () => null,
          energyReward: 120,
        },
      };
    }
  },
}));

jest.mock('@/games/registry', () => ({
  registerBuiltInGames: jest.fn(),
}));

jest.mock('@/services/game-logger', () => ({
  gameLogger: {
    listByUser: () => [],
  },
}));

jest.mock('@/services/preference-store', () => ({
  preferenceStore: {
    listByUser: () => [],
    save: (...args: unknown[]) => mockSavePreference(...args),
  },
}));

jest.mock('@/utils/energyLogic', () => ({
  syncPlanetProgress: () => Promise.resolve({ progress: 50 }),
}));

jest.mock('@/utils/storage', () => ({
  advanceDebugDateByDays: (...args: unknown[]) => mockAdvanceDebugDateByDays(...args),
  claimChest: () => null,
  formatRemainingTime: () => '00:00:00',
  getChestStatus: () => ({ status: 'none', chest: null, remainingTime: 0 }),
  getTodayDateString: (...args: unknown[]) => mockGetTodayDateString(...args),
  loadProgress: () => ({
    todayDate: '2026-02-11',
    todayAttempts: 0,
    todayCompleted: false,
    todayChestLevel: null,
    heroAttempted: false,
    heroCompleted: false,
    pendingChest: null,
    consecutiveDays: 1,
  }),
  saveProgress: jest.fn(),
}));

import StarlightPage from '@/pages/starlight/index';

describe('pages/starlight debug controls regressions', () => {
  beforeEach(() => {
    (global as unknown as { confirm: (message: string) => boolean }).confirm = jest.fn(() => true);
    (global as unknown as { alert: (message: string) => void }).alert = jest.fn();
    mockAdvanceDebugDateByDays.mockReset();
  });

  test('renders debug buttons and next-day button calls date advance', async () => {
    const tree = render(<StarlightPage />, {});

    expect(tree.container.textContent).toContain('📅');
    expect(tree.container.textContent).toContain('🎯');

    await act(async () => {
      const buttons = Array.from(tree.container.querySelectorAll('.debug-btn')) as HTMLElement[];
      const nextDayButton = buttons.find((item) => item.textContent === '📅');
      if (!nextDayButton) {
        throw new Error('Next-day debug button not found');
      }
      nextDayButton.click();
      await Promise.resolve();
    });

    expect(mockAdvanceDebugDateByDays).toHaveBeenCalledWith(1);
  });
});
