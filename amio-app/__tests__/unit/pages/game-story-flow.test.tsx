import React from 'react';
import { act, render } from '@tarojs/test-utils-react/dist/pure';

const mockSwitchTab = jest.fn();
const mockReLaunch = jest.fn();
const mockRedirectTo = jest.fn();
const mockMarkStoryViewed = jest.fn();
const mockGetNextStoryDay = jest.fn(() => 1);

const mockPlugin = {
  id: '3tiles',
  meta: {
    id: '3tiles',
    narrativeName: 'Three Tiles',
    narrativeDesc: 'desc',
    icon: '🀄️',
    thumbnailComponent: () => null,
    energyReward: 120,
  },
  getHeroConfig: () => ({ enabled: true, mode: 'hero', description: 'hero' }),
  GameComponent: () => null,
};

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    switchTab: (...args: unknown[]) => mockSwitchTab(...args),
    reLaunch: (...args: unknown[]) => mockReLaunch(...args),
    redirectTo: (...args: unknown[]) => mockRedirectTo(...args),
  },
  useRouter: () => ({
    params: {
      mode: 'normal',
      gameType: '3tiles',
    },
  }),
}));

jest.mock('@/components/StoryModal/StoryModal', () => ({
  __esModule: true,
  default: ({ storyDay, onComplete }: { storyDay: number; onComplete: () => void }) => (
    <div className="story-modal-test">
      <span>{`Story Day ${storyDay}`}</span>
      <button className="story-complete-btn" onClick={onComplete} type="button">
        Continue Story
      </button>
    </div>
  ),
}));

jest.mock('@/engine/game-engine', () => ({
  GameEngine: class {
    startGame() {
      return {
        status: 'playing',
        startedAt: 1,
        attempts: 1,
        toolsUsed: 0,
        undoUsed: false,
        shuffleUsed: false,
        popUsed: false,
      };
    }

    getTodayGame() {
      return mockPlugin;
    }

    setGame() {
      return;
    }

    dispatch() {
      return {
        status: 'playing',
        startedAt: 1,
        attempts: 1,
        toolsUsed: 0,
        undoUsed: false,
        shuffleUsed: false,
        popUsed: false,
      };
    }

    useTool() {
      return {
        status: 'playing',
        startedAt: 1,
        attempts: 1,
        toolsUsed: 1,
        undoUsed: true,
        shuffleUsed: false,
        popUsed: false,
      };
    }

    enterSettlement() {
      return {
        result: {
          gameId: '3tiles',
          mode: 'normal',
          status: 'cleared',
          attempts: 1,
          durationSeconds: 10,
          toolsUsed: 0,
          heroAttempted: false,
        },
        chestLevel: 'gold',
        performance: {
          efficiencyScore: 80,
          toolsUsed: 0,
          rawData: {},
        },
      };
    }

    onGameEnd() {
      return this.enterSettlement();
    }

    getChestLevelAsEnum() {
      return 'gold';
    }
  },
}));

jest.mock('@/engine/game-registry', () => ({
  gameRegistry: {
    get: () => mockPlugin,
  },
}));

jest.mock('@/games/registry', () => ({
  registerBuiltInGames: jest.fn(),
}));

jest.mock('@/utils/storage', () => ({
  getTodayDateString: () => '2026-02-11',
  getNextStoryDay: (...args: unknown[]) => mockGetNextStoryDay(...args),
  markStoryViewed: (...args: unknown[]) => mockMarkStoryViewed(...args),
  loadProgress: () => ({
    pendingChest: {
      levels: ['gold'],
    },
    storyProgress: 0,
    viewedStories: [],
    consecutiveDays: 2,
  }),
  savePendingChest: jest.fn(),
  updateEnergyAfterGame: jest.fn(),
  updateTodayStatus: jest.fn(),
}));

import GamePage from '@/pages/game/index';

describe('pages/game story flow regression', () => {
  beforeEach(() => {
    mockMarkStoryViewed.mockReset();
    mockGetNextStoryDay.mockReturnValue(1);
  });

  test('shows story modal before chest modal and marks story viewed on continue', async () => {
    const tree = render(<GamePage />, {});

    await act(async () => {
      const button = tree.container.querySelector('.test-win-btn') as HTMLElement | null;
      if (!button) {
        throw new Error('One-Click Win button not found');
      }
      button.click();
      await Promise.resolve();
    });

    expect(tree.container.textContent).toContain('Story Day 1');
    expect(tree.container.textContent).not.toContain('领取宝箱');

    await act(async () => {
      const continueButton = tree.container.querySelector('.story-complete-btn') as HTMLElement | null;
      if (!continueButton) {
        throw new Error('Story continue button not found');
      }
      continueButton.click();
      await Promise.resolve();
    });

    expect(mockMarkStoryViewed).toHaveBeenCalledWith(1);
    expect(tree.container.textContent).toContain('领取宝箱');
    expect(tree.container.textContent).toContain('喜欢');
    expect(tree.container.textContent).toContain('不喜欢');
  });
});
