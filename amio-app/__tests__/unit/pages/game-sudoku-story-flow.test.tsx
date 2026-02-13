import React from 'react';
import { act, render } from '@tarojs/test-utils-react/dist/pure';

const mockSwitchTab = jest.fn();
const mockReLaunch = jest.fn();
const mockRedirectTo = jest.fn();
const mockMarkStoryViewed = jest.fn();
const mockGetNextStoryDay = jest.fn(() => 1);

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
      gameType: 'sudoku',
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

jest.mock('@/engine/game-engine', () => {
  const sudokuPlugin = require('@/games/sudoku').default;

  return {
    GameEngine: class {
      private state: ReturnType<typeof sudokuPlugin.initGame> | null = null;

      getTodayGame() {
        return sudokuPlugin;
      }

      setGame() {
        return;
      }

      startGame(config: { mode: 'normal' | 'hero'; date: string; userId: string }) {
        this.state = sudokuPlugin.initGame({ ...config, seed: 601 });
        return this.state;
      }

      dispatch(action: { type: string; payload?: Record<string, unknown> }) {
        if (!this.state) {
          throw new Error('Game state not initialized');
        }
        this.state = sudokuPlugin.handleAction(this.state, action);
        return this.state;
      }

      useTool(toolId: string) {
        if (!this.state) {
          throw new Error('Game state not initialized');
        }
        this.state = sudokuPlugin.useTool(this.state, toolId);
        return this.state;
      }

      enterSettlement(result: Record<string, unknown>) {
        if (!this.state) {
          throw new Error('Game state not initialized');
        }
        return {
          result,
          chestLevel: 'gold',
          performance: sudokuPlugin.getPerformance(this.state),
        };
      }

      onGameEnd(result: Record<string, unknown>) {
        return this.enterSettlement(result);
      }

      getChestLevelAsEnum() {
        return 'gold';
      }
    },
  };
});

jest.mock('@/engine/game-registry', () => {
  const sudokuPlugin = require('@/games/sudoku').default;
  return {
    gameRegistry: {
      get: () => sudokuPlugin,
    },
  };
});

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

describe('pages/game sudoku story flow regression', () => {
  beforeEach(() => {
    mockGetNextStoryDay.mockReset();
    mockGetNextStoryDay.mockReturnValue(1);
    mockMarkStoryViewed.mockReset();
  });

  test('shows story modal before settlement and marks story viewed on continue', async () => {
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
