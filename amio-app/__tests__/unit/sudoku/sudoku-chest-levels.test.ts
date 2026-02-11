import { chestRatingEngine } from '@/engine/chest-rating';
import sudokuPlugin from '@/games/sudoku';
import { sudokuRatingConfig } from '@/games/sudoku/rating-config';

const rateSudokuByCondition = (durationSeconds: number, toolsUsed: number): string => {
  const state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 77 });
  const adjustedState = {
    ...state,
    startedAt: 0,
    endedAt: durationSeconds * 1000,
    toolsUsed,
    status: 'cleared' as const,
  };
  const performance = sudokuPlugin.getPerformance(adjustedState);
  return chestRatingEngine.rate(performance, sudokuRatingConfig);
};

describe('sudoku/chest-levels', () => {
  test('rates diamond for fast clear without tools', () => {
    expect(rateSudokuByCondition(100, 0)).toBe('diamond');
  });

  test('rates gold for fast clear with one tool', () => {
    expect(rateSudokuByCondition(100, 1)).toBe('gold');
  });

  test('rates silver for medium clear with one tool', () => {
    expect(rateSudokuByCondition(300, 1)).toBe('silver');
  });

  test('rates bronze for slow clear', () => {
    expect(rateSudokuByCondition(700, 0)).toBe('bronze');
  });
});
