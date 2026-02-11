import { SudokuGrid, SudokuRules, countSudokuSolutions } from '@/games/sudoku/solver';

export interface SudokuPuzzle {
  size: number;
  boxRows: number;
  boxCols: number;
  symbols: string[];
  givens: SudokuGrid;
  solution: string[][];
}

export interface SudokuGenerateOptions {
  mode: 'normal' | 'hero';
  seed?: number;
}

const createSeededRandom = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

const shuffle = <T,>(items: T[], random: () => number): T[] => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const createSolvedGrid = (rules: SudokuRules, random: () => number): string[][] => {
  const baseRows = [...Array(rules.size).keys()];
  const baseCols = [...Array(rules.size).keys()];

  const rowBands = [...Array(rules.size / rules.boxRows).keys()];
  const colBands = [...Array(rules.size / rules.boxCols).keys()];

  const rows = shuffle(rowBands, random).flatMap((band) => shuffle(baseRows.slice(band * rules.boxRows, (band + 1) * rules.boxRows), random));
  const cols = shuffle(colBands, random).flatMap((band) => shuffle(baseCols.slice(band * rules.boxCols, (band + 1) * rules.boxCols), random));

  const symbols = shuffle(rules.symbols, random);

  return rows.map((row) =>
    cols.map((col) => {
      const idx = (row * rules.boxCols + Math.floor(row / rules.boxRows) + col) % rules.size;
      return symbols[idx];
    })
  );
};

const clone = (grid: SudokuGrid): SudokuGrid => grid.map((row) => [...row]);

const removeCellsWithUniqueSolution = (
  solved: string[][],
  rules: SudokuRules,
  targetGivens: number,
  random: () => number
): SudokuGrid => {
  const puzzle: SudokuGrid = solved.map((row) => [...row]);
  const positions: Array<[number, number]> = [];

  for (let row = 0; row < rules.size; row += 1) {
    for (let col = 0; col < rules.size; col += 1) {
      positions.push([row, col]);
    }
  }

  const shuffled = shuffle(positions, random);
  let givens = rules.size * rules.size;

  for (const [row, col] of shuffled) {
    if (givens <= targetGivens) {
      break;
    }

    const prev = puzzle[row][col];
    puzzle[row][col] = null;
    const count = countSudokuSolutions(clone(puzzle), rules, 2);

    if (count !== 1) {
      puzzle[row][col] = prev;
      continue;
    }

    givens -= 1;
  }

  return puzzle;
};

export const getSudokuRules = (mode: 'normal' | 'hero'): SudokuRules => {
  if (mode === 'hero') {
    return {
      size: 6,
      boxRows: 2,
      boxCols: 3,
      symbols: ['🏓', '⭐', '🦈', '💙', '🏅', '👑'],
    };
  }

  return {
    size: 4,
    boxRows: 2,
    boxCols: 2,
    symbols: ['🏓', '⭐', '🦈', '💙'],
  };
};

export const generateSudokuPuzzle = (options: SudokuGenerateOptions): SudokuPuzzle => {
  const rules = getSudokuRules(options.mode);
  const seed = options.seed ?? Date.now();
  const random = createSeededRandom(seed);

  const solved = createSolvedGrid(rules, random);
  const givenMin = options.mode === 'hero' ? 12 : 6;
  const givenMax = options.mode === 'hero' ? 16 : 8;
  const target = givenMin + Math.floor(random() * (givenMax - givenMin + 1));
  const givens = removeCellsWithUniqueSolution(solved, rules, target, random);

  return {
    size: rules.size,
    boxRows: rules.boxRows,
    boxCols: rules.boxCols,
    symbols: rules.symbols,
    givens,
    solution: solved,
  };
};
