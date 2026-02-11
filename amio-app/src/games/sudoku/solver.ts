export type SudokuCellValue = string | null;
export type SudokuGrid = SudokuCellValue[][];

export interface SudokuRules {
  size: number;
  boxRows: number;
  boxCols: number;
  symbols: string[];
}

const cloneGrid = (grid: SudokuGrid): SudokuGrid => grid.map((row) => [...row]);

const findEmpty = (grid: SudokuGrid): [number, number] | null => {
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === null) {
        return [row, col];
      }
    }
  }
  return null;
};

export const isValidPlacement = (
  grid: SudokuGrid,
  row: number,
  col: number,
  value: string,
  rules: SudokuRules
): boolean => {
  for (let i = 0; i < rules.size; i += 1) {
    if (grid[row][i] === value && i !== col) {
      return false;
    }
    if (grid[i][col] === value && i !== row) {
      return false;
    }
  }

  const startRow = Math.floor(row / rules.boxRows) * rules.boxRows;
  const startCol = Math.floor(col / rules.boxCols) * rules.boxCols;
  for (let r = startRow; r < startRow + rules.boxRows; r += 1) {
    for (let c = startCol; c < startCol + rules.boxCols; c += 1) {
      if (r === row && c === col) {
        continue;
      }
      if (grid[r][c] === value) {
        return false;
      }
    }
  }

  return true;
};

const solveBacktracking = (grid: SudokuGrid, rules: SudokuRules): boolean => {
  const next = findEmpty(grid);
  if (!next) {
    return true;
  }

  const [row, col] = next;
  for (const value of rules.symbols) {
    if (isValidPlacement(grid, row, col, value, rules)) {
      grid[row][col] = value;
      if (solveBacktracking(grid, rules)) {
        return true;
      }
      grid[row][col] = null;
    }
  }

  return false;
};

export const solveSudoku = (grid: SudokuGrid, rules: SudokuRules): SudokuGrid | null => {
  const candidate = cloneGrid(grid);
  const ok = solveBacktracking(candidate, rules);
  return ok ? candidate : null;
};

const countBacktracking = (grid: SudokuGrid, rules: SudokuRules, limit: number): number => {
  const next = findEmpty(grid);
  if (!next) {
    return 1;
  }

  const [row, col] = next;
  let count = 0;
  for (const value of rules.symbols) {
    if (!isValidPlacement(grid, row, col, value, rules)) {
      continue;
    }

    grid[row][col] = value;
    count += countBacktracking(grid, rules, limit);
    if (count >= limit) {
      grid[row][col] = null;
      return count;
    }
    grid[row][col] = null;
  }

  return count;
};

export const countSudokuSolutions = (
  grid: SudokuGrid,
  rules: SudokuRules,
  limit: number = 2
): number => {
  const candidate = cloneGrid(grid);
  return countBacktracking(candidate, rules, limit);
};
