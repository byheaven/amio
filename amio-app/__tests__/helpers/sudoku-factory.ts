import { SudokuCellValue } from '@/games/sudoku/solver';

export const createSimple4x4Puzzle = (): {
  givens: SudokuCellValue[][];
  solution: string[][];
} => {
  const solution: string[][] = [
    ['🏓', '⭐', '🦈', '💙'],
    ['🦈', '💙', '🏓', '⭐'],
    ['⭐', '🏓', '💙', '🦈'],
    ['💙', '🦈', '⭐', '🏓'],
  ];

  const givens: SudokuCellValue[][] = [
    ['🏓', null, '🦈', null],
    [null, '💙', null, '⭐'],
    ['⭐', null, '💙', null],
    [null, '🦈', null, '🏓'],
  ];

  return { givens, solution };
};
