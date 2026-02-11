import { generateSudokuPuzzle, getSudokuRules } from '@/games/sudoku/generator';
import { countSudokuSolutions } from '@/games/sudoku/solver';

describe('sudoku/generator', () => {
  test('normal puzzle has unique solution', () => {
    const puzzle = generateSudokuPuzzle({ mode: 'normal', seed: 123 });
    const count = countSudokuSolutions(puzzle.givens, getSudokuRules('normal'), 2);

    expect(count).toBe(1);
    expect(puzzle.givens.length).toBe(4);
  });

  test('hero puzzle has configured size', () => {
    const puzzle = generateSudokuPuzzle({ mode: 'hero', seed: 123 });
    expect(puzzle.givens.length).toBe(6);
    expect(puzzle.givens[0].length).toBe(6);
  });
});
