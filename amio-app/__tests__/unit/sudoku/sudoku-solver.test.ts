import { countSudokuSolutions, solveSudoku } from '@/games/sudoku/solver';
import { createSimple4x4Puzzle } from '../../helpers/sudoku-factory';

describe('sudoku/solver', () => {
  test('solves 4x4 puzzle', () => {
    const puzzle = createSimple4x4Puzzle();
    const solved = solveSudoku(puzzle.givens, {
      size: 4,
      boxRows: 2,
      boxCols: 2,
      symbols: ['🏓', '⭐', '🦈', '💙'],
    });

    expect(solved).not.toBeNull();
    expect(solved?.[0][0]).toBe('🏓');
  });

  test('counts unique solution', () => {
    const puzzle = createSimple4x4Puzzle();
    const count = countSudokuSolutions(
      puzzle.givens,
      { size: 4, boxRows: 2, boxCols: 2, symbols: ['🏓', '⭐', '🦈', '💙'] },
      2
    );
    expect(count).toBe(1);
  });
});
