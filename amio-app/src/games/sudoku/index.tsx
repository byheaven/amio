import React from 'react';
import { View, Text } from '@tarojs/components';
import { GameAction, GameConfig, GameState, PerformanceMetrics } from '@/engine/types';
import { GamePlugin, GameComponentProps } from '@/types/game-plugin';
import { generateSudokuPuzzle } from '@/games/sudoku/generator';
import { SudokuCellValue } from '@/games/sudoku/solver';
import { sudokuRatingConfig } from '@/games/sudoku/rating-config';
import SudokuThumbnail from '@/games/sudoku/thumbnail';
import SudokuBoard from '@/games/sudoku/components/SudokuBoard';
import IconSelector from '@/games/sudoku/components/IconSelector';
import HeroTimer from '@/games/sudoku/components/HeroTimer';
import './index.scss';

interface SudokuPuzzleState {
  size: number;
  boxRows: number;
  boxCols: number;
  symbols: string[];
  givens: SudokuCellValue[][];
  solution: string[][];
}

export interface SudokuState extends GameState {
  gameId: 'sudoku';
  mode: 'normal' | 'hero';
  puzzle: SudokuPuzzleState;
  grid: SudokuCellValue[][];
  selectedCell: { row: number; col: number } | null;
  errorCells: Array<{ row: number; col: number }>;
  hintUsed: number;
  checkUsed: number;
  remainingSeconds: number;
  maxHint: number;
  maxCheck: number;
  lastUnavailableAction: string | null;
  uiMessage: string | null;
}

const cloneGrid = (grid: SudokuCellValue[][]): SudokuCellValue[][] => grid.map((row) => [...row]);

const allFilled = (grid: SudokuCellValue[][]): boolean => grid.every((row) => row.every((cell) => cell !== null));

const collectErrors = (grid: SudokuCellValue[][], solution: string[][]): Array<{ row: number; col: number }> => {
  const errors: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] !== null && grid[row][col] !== solution[row][col]) {
        errors.push({ row, col });
      }
    }
  }
  return errors;
};

const isInBounds = (state: SudokuState, row: number, col: number): boolean => {
  return row >= 0 && col >= 0 && row < state.puzzle.size && col < state.puzzle.size;
};

const evaluateSudokuState = (state: SudokuState): SudokuState => {
  if (state.mode === 'hero' && state.remainingSeconds <= 0) {
    return {
      ...state,
      status: 'failed',
      endedAt: Date.now(),
      remainingSeconds: 0,
    };
  }

  if (!allFilled(state.grid)) {
    return {
      ...state,
      errorCells: [],
    };
  }

  const errors = collectErrors(state.grid, state.puzzle.solution);
  if (errors.length === 0) {
    return {
      ...state,
      status: 'cleared',
      endedAt: Date.now(),
      errorCells: [],
    };
  }

  return {
    ...state,
    errorCells: errors,
    uiMessage: 'There are incorrect cells. Fix the highlighted cells.',
  };
};

const createSudokuState = (config: GameConfig): SudokuState => {
  const puzzle = generateSudokuPuzzle({ mode: config.mode, seed: config.seed });
  return {
    gameId: 'sudoku',
    mode: config.mode,
    status: 'playing',
    startedAt: Date.now(),
    attempts: 1,
    toolsUsed: 0,
    puzzle,
    grid: cloneGrid(puzzle.givens),
    selectedCell: null,
    errorCells: [],
    hintUsed: 0,
    checkUsed: 0,
    remainingSeconds: config.mode === 'hero' ? 180 : 0,
    maxHint: 1,
    maxCheck: 0,
    lastUnavailableAction: null,
    uiMessage: null,
  };
};

const canEditCell = (state: SudokuState, row: number, col: number): boolean => {
  if (!isInBounds(state, row, col)) {
    return false;
  }
  return state.puzzle.givens[row][col] === null;
};

const setCellValue = (state: SudokuState, value: string | null): SudokuState => {
  if (!state.selectedCell) {
    return {
      ...state,
      uiMessage: 'Select an editable cell first.',
    };
  }

  const { row, col } = state.selectedCell;
  if (!canEditCell(state, row, col)) {
    return {
      ...state,
      uiMessage: 'This cell is fixed and cannot be changed.',
    };
  }

  const nextGrid = cloneGrid(state.grid);
  nextGrid[row][col] = value;

  return evaluateSudokuState({
    ...state,
    grid: nextGrid,
    uiMessage: null,
  });
};

const findHintCell = (state: SudokuState): { row: number; col: number } | null => {
  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      if (!canEditCell(state, row, col)) {
        continue;
      }
      if (state.grid[row][col] !== state.puzzle.solution[row][col]) {
        return { row, col };
      }
    }
  }
  return null;
};

const getSelectorDisabledReason = (state: SudokuState): string | null => {
  if (!state.selectedCell) {
    return 'Select an editable cell first.';
  }

  const { row, col } = state.selectedCell;
  if (!canEditCell(state, row, col)) {
    return 'This cell is fixed and cannot be changed.';
  }

  return null;
};

const getDurationSeconds = (state: SudokuState): number => {
  const end = state.endedAt ?? Date.now();
  return Math.max(1, Math.floor((end - state.startedAt) / 1000));
};

const getEfficiencyScore = (state: SudokuState): number => {
  const duration = getDurationSeconds(state);
  let baseScore = 30;

  if (duration <= 120) {
    baseScore = 95;
  } else if (duration <= 240) {
    baseScore = 75;
  } else if (duration <= 480) {
    baseScore = 50;
  }

  const toolPenalty = state.toolsUsed * 8;
  return Math.max(0, baseScore - toolPenalty);
};

const SudokuGameComponent: React.FC<GameComponentProps<SudokuState>> = ({ state, onAction, onUseTool, mode }) => {
  const selectorDisabledReason = getSelectorDisabledReason(state);
  const selectorDisabled = selectorDisabledReason !== null;
  const remainingHint = Math.max(0, state.maxHint - state.hintUsed);
  const remainingCheck = Math.max(0, state.maxCheck - state.checkUsed);
  const checkUnavailable = remainingCheck <= 0;

  return (
    <View className="sudoku-game">
      <Text className="sudoku-game__title">Sudoku</Text>
      {mode === 'hero' && <HeroTimer remainingSeconds={state.remainingSeconds} totalSeconds={180} />}
      <SudokuBoard
        size={state.puzzle.size}
        boxRows={state.puzzle.boxRows}
        boxCols={state.puzzle.boxCols}
        grid={state.grid}
        givens={state.puzzle.givens}
        selectedCell={state.selectedCell}
        errorCells={state.errorCells}
        onSelect={(row, col) => onAction({ type: 'select_cell', payload: { row, col } })}
      />
      <IconSelector
        symbols={state.puzzle.symbols}
        onPick={(symbol) => onAction({ type: 'input_symbol', payload: { symbol } })}
        onClear={() => onAction({ type: 'clear_cell' })}
        disabled={selectorDisabled}
        disabledReason={selectorDisabledReason}
      />
      <View className="sudoku-tools">
        <View className={`sudoku-tools__item${remainingHint <= 0 ? ' sudoku-tools__item--disabled' : ''}`} onClick={() => onUseTool('hint')}>
          <Text>💡 Hint {remainingHint}/{state.maxHint}</Text>
        </View>
        <View
          className={`sudoku-tools__item${checkUnavailable ? ' sudoku-tools__item--disabled' : ''}`}
          onClick={() => onUseTool('check')}
        >
          <Text>✅ Check {remainingCheck}/{state.maxCheck}</Text>
        </View>
      </View>
      {state.uiMessage && <Text className="sudoku-message">{state.uiMessage}</Text>}
    </View>
  );
};

const sudokuPlugin: GamePlugin<SudokuState> = {
  id: 'sudoku',
  meta: {
    id: 'sudoku',
    narrativeName: 'Star Chart Decode',
    narrativeDesc: 'Decode ancient coordinates by solving icon Sudoku.',
    icon: '🔮',
    thumbnailComponent: SudokuThumbnail,
    energyReward: 120,
  },
  ratingConfig: sudokuRatingConfig,
  initGame: createSudokuState,
  handleAction: (state: SudokuState, action: GameAction): SudokuState => {
    if (state.status !== 'playing' && action.type !== 'retry') {
      return state;
    }

    switch (action.type) {
      case 'select_cell': {
        const row = action.payload?.row;
        const col = action.payload?.col;
        if (typeof row !== 'number' || typeof col !== 'number') {
          return {
            ...state,
            uiMessage: 'Invalid cell selection.',
          };
        }
        if (!isInBounds(state, row, col)) {
          return {
            ...state,
            uiMessage: 'Invalid cell selection.',
          };
        }

        if (!canEditCell(state, row, col)) {
          return {
            ...state,
            selectedCell: { row, col },
            uiMessage: 'This cell is fixed and cannot be changed.',
          };
        }

        return {
          ...state,
          selectedCell: { row, col },
          uiMessage: null,
        };
      }
      case 'input_symbol': {
        const symbol = action.payload?.symbol;
        if (typeof symbol !== 'string') {
          return {
            ...state,
            uiMessage: 'Invalid symbol selection.',
          };
        }
        if (!state.puzzle.symbols.includes(symbol)) {
          return {
            ...state,
            uiMessage: 'Invalid symbol selection.',
          };
        }
        return setCellValue(state, symbol);
      }
      case 'clear_cell':
        return setCellValue(state, null);
      case 'tick': {
        if (state.mode !== 'hero') {
          return state;
        }
        const deltaSeconds = action.payload?.deltaSeconds;
        const delta = typeof deltaSeconds === 'number' && deltaSeconds > 0 ? deltaSeconds : 1;
        return evaluateSudokuState({
          ...state,
          remainingSeconds: Math.max(0, state.remainingSeconds - delta),
        });
      }
      case 'retry':
        return {
          ...createSudokuState({ mode: state.mode, date: '', seed: Date.now() }),
          attempts: state.attempts + 1,
        };
      case 'quit':
        return {
          ...state,
          status: 'quit',
          endedAt: Date.now(),
          uiMessage: null,
        };
      default:
        return state;
    }
  },
  getStatus: (state: SudokuState) => state.status,
  getPerformance: (state: SudokuState): PerformanceMetrics => ({
    efficiencyScore: getEfficiencyScore(state),
    toolsUsed: state.toolsUsed,
    rawData: {
      attempts: state.attempts,
      durationSeconds: getDurationSeconds(state),
      mode: state.mode,
      remainingSeconds: state.remainingSeconds,
    },
  }),
  getTools: () => [
    { id: 'hint', name: 'Hint', description: 'Fill one cell with a correct symbol.', freeUses: 1 },
    { id: 'check', name: 'Check', description: 'Unavailable in MVP. Paid flow will be added later.', freeUses: 0 },
  ],
  useTool: (state: SudokuState, toolId: string): SudokuState => {
    if (state.status !== 'playing') {
      return state;
    }

    if (toolId === 'hint') {
      if (state.hintUsed >= state.maxHint) {
        return {
          ...state,
          lastUnavailableAction: 'hint',
          uiMessage: 'Hint has already been used.',
        };
      }

      const target = findHintCell(state);
      if (!target) {
        return {
          ...state,
          uiMessage: 'No available cell for hint.',
        };
      }

      const grid = cloneGrid(state.grid);
      grid[target.row][target.col] = state.puzzle.solution[target.row][target.col];
      return evaluateSudokuState({
        ...state,
        grid,
        hintUsed: state.hintUsed + 1,
        toolsUsed: state.toolsUsed + 1,
        lastUnavailableAction: null,
        uiMessage: 'Hint filled one cell.',
      });
    }

    if (toolId === 'check') {
      if (state.maxCheck <= state.checkUsed) {
        return {
          ...state,
          lastUnavailableAction: 'check',
          uiMessage: 'Check is unavailable in MVP.',
        };
      }

      return {
        ...state,
        checkUsed: state.checkUsed + 1,
        toolsUsed: state.toolsUsed + 1,
        errorCells: collectErrors(state.grid, state.puzzle.solution),
        uiMessage: null,
      };
    }

    return {
      ...state,
      uiMessage: 'Unknown tool action.',
    };
  },
  getHeroConfig: () => ({
    enabled: true,
    mode: 'hero',
    timeLimitSeconds: 180,
    description: '6x6 Sudoku with a 3-minute countdown.',
  }),
  GameComponent: SudokuGameComponent,
};

export default sudokuPlugin;
