import { defineFeature, loadFeature } from 'jest-cucumber';
import sudokuPlugin, { SudokuState } from '@/games/sudoku';
import { SudokuCellValue } from '@/games/sudoku/solver';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/sudoku/sudoku-tool-ux.feature');

const cloneGrid = (grid: SudokuCellValue[][]): SudokuCellValue[][] => grid.map((row) => [...row]);

const countFilledEditable = (state: SudokuState): number => {
  let count = 0;
  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      if (state.puzzle.givens[row][col] !== null) {
        continue;
      }
      if (state.grid[row][col] !== null) {
        count += 1;
      }
    }
  }
  return count;
};

defineFeature(feature, (test) => {
  test('Hint tool fills one incorrect editable cell and decrements remaining hint', ({ given, when, then }) => {
    let state: SudokuState;
    let beforeFilled = 0;

    given('a sudoku game where hint is available', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 18 });
      beforeFilled = countFilledEditable(state);
      expect(state.hintUsed).toBe(0);
    });

    when('I use the hint tool once', () => {
      state = sudokuPlugin.useTool(state, 'hint');
    });

    then('one editable cell should be filled correctly and remaining hint should decrease', () => {
      const afterFilled = countFilledEditable(state);
      expect(afterFilled).toBe(beforeFilled + 1);
      expect(state.hintUsed).toBe(1);
      expect(state.maxHint - state.hintUsed).toBe(0);
    });
  });

  test('Check tool is unavailable with explicit reason and no board mutation', ({ given, when, then }) => {
    let state: SudokuState;
    let beforeGrid: SudokuCellValue[][] = [];

    given('a sudoku game with a recorded board snapshot', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 19 });
      beforeGrid = cloneGrid(state.grid);
      expect(state.maxCheck).toBe(0);
    });

    when('I use the check tool', () => {
      state = sudokuPlugin.useTool(state, 'check');
    });

    then('the board should remain unchanged and unavailable reason should be visible', () => {
      expect(state.grid).toEqual(beforeGrid);
      expect(state.lastUnavailableAction).toBe('check');
      expect((state as SudokuState & { uiMessage?: string | null }).uiMessage).toBe('MVP 阶段暂不开放校验功能。');
    });
  });
});
