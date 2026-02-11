import React from 'react';
import { render } from '@tarojs/test-utils-react/dist/pure';
import SudokuBoard from '@/games/sudoku/components/SudokuBoard';
import { SudokuCellValue } from '@/games/sudoku/solver';

const createGrid = (size: number): SudokuCellValue[][] => {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
};

describe('sudoku/board-render', () => {
  test('renders 4x4 board with data attributes and state classes', () => {
    const grid = createGrid(4);
    const givens = createGrid(4);
    givens[0][0] = '🏓';
    grid[0][0] = '🏓';
    grid[1][1] = '⭐';

    const tree = render(
      <SudokuBoard
        size={4}
        boxRows={2}
        boxCols={2}
        grid={grid}
        givens={givens}
        selectedCell={{ row: 1, col: 1 }}
        errorCells={[{ row: 1, col: 1 }]}
        onSelect={() => {
          return;
        }}
      />,
      {}
    );

    const cells = tree.container.querySelectorAll('[data-cell-row]');
    expect(cells.length).toBe(16);

    const firstCell = tree.container.querySelector('[data-cell-row="0"][data-cell-col="0"]');
    expect(firstCell?.getAttribute('data-cell-given')).toBe('true');
    expect(firstCell?.className).toContain('sudoku-cell--box-top');
    expect(firstCell?.className).toContain('sudoku-cell--box-left');

    const selectedErrorCell = tree.container.querySelector('[data-cell-row="1"][data-cell-col="1"]');
    expect(selectedErrorCell?.getAttribute('data-cell-selected')).toBe('true');
    expect(selectedErrorCell?.getAttribute('data-cell-error')).toBe('true');
    expect(selectedErrorCell?.className).toContain('sudoku-cell--selected');
    expect(selectedErrorCell?.className).toContain('sudoku-cell--error');
  });

  test('renders 6x6 board with 36 cells', () => {
    const grid = createGrid(6);
    const givens = createGrid(6);

    const tree = render(
      <SudokuBoard
        size={6}
        boxRows={2}
        boxCols={3}
        grid={grid}
        givens={givens}
        selectedCell={null}
        errorCells={[]}
        onSelect={() => {
          return;
        }}
      />,
      {}
    );

    expect(tree.container.querySelectorAll('[data-cell-row]').length).toBe(36);
  });
});
