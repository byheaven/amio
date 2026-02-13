import React from 'react';
import { render } from '@tarojs/test-utils-react/dist/pure';
import { defineFeature, loadFeature } from 'jest-cucumber';
import sudokuPlugin, { SudokuState } from '@/games/sudoku';
import { SudokuCellValue } from '@/games/sudoku/solver';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/sudoku/sudoku-ui-playability.feature');

const findEditableCell = (state: SudokuState): { row: number; col: number } | null => {
  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      if (state.puzzle.givens[row][col] === null) {
        return { row, col };
      }
    }
  }
  return null;
};

const findGivenCell = (state: SudokuState): { row: number; col: number } | null => {
  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      if (state.puzzle.givens[row][col] !== null) {
        return { row, col };
      }
    }
  }
  return null;
};

const findWrongSymbol = (state: SudokuState, row: number, col: number): string => {
  const correct = state.puzzle.solution[row][col];
  const wrong = state.puzzle.symbols.find((item) => item !== correct);
  if (!wrong) {
    throw new Error('Unable to find wrong symbol for test');
  }
  return wrong;
};

defineFeature(feature, (test) => {
  test('Sudoku board renders correct grid dimensions in normal mode', ({ given, when, then }) => {
    let state: SudokuState;
    let cellCount = 0;

    given('a sudoku game UI in normal mode', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 11 });
    });

    when('I render the sudoku board', () => {
      const tree = render(
        <sudokuPlugin.GameComponent
          state={state}
          onAction={() => {
            return;
          }}
          onUseTool={() => {
            return;
          }}
          mode="normal"
        />,
        {}
      );
      cellCount = tree.container.querySelectorAll('[data-cell-row]').length;
    });

    then('I should see 16 sudoku cells', () => {
      expect(cellCount).toBe(16);
    });
  });

  test('Sudoku board renders correct grid dimensions in hero mode', ({ given, when, then }) => {
    let state: SudokuState;
    let cellCount = 0;

    given('a sudoku game UI in hero mode', () => {
      state = sudokuPlugin.initGame({ mode: 'hero', date: '2026-02-11', seed: 12 });
    });

    when('I render the sudoku board', () => {
      const tree = render(
        <sudokuPlugin.GameComponent
          state={state}
          onAction={() => {
            return;
          }}
          onUseTool={() => {
            return;
          }}
          mode="hero"
        />,
        {}
      );
      cellCount = tree.container.querySelectorAll('[data-cell-row]').length;
    });

    then('I should see 36 sudoku cells', () => {
      expect(cellCount).toBe(36);
    });
  });

  test('Selecting editable cell enables symbol input and applies chosen symbol', ({ given, when, then }) => {
    let state: SudokuState;
    let editableCell: { row: number; col: number } | null = null;
    let chosenSymbol = '';

    given('a sudoku game with at least one editable cell', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 13 });
      editableCell = findEditableCell(state);
      if (!editableCell) {
        throw new Error('Editable cell not found');
      }
      chosenSymbol = state.puzzle.solution[editableCell.row][editableCell.col];
    });

    when('I select that editable cell and input a valid symbol', () => {
      if (!editableCell) {
        throw new Error('Editable cell not found');
      }
      state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: editableCell });
      state = sudokuPlugin.handleAction(state, { type: 'input_symbol', payload: { symbol: chosenSymbol } });
    });

    then('the selected editable cell should contain the symbol', () => {
      if (!editableCell) {
        throw new Error('Editable cell not found');
      }
      expect(state.grid[editableCell.row][editableCell.col]).toBe(chosenSymbol);
    });
  });

  test('Selecting given cell keeps it immutable and reports lock feedback', ({ given, when, then }) => {
    let state: SudokuState;
    let givenCell: { row: number; col: number } | null = null;
    let originalValue: SudokuCellValue = null;

    given('a sudoku game with at least one given cell', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 14 });
      givenCell = findGivenCell(state);
      if (!givenCell) {
        throw new Error('Given cell not found');
      }
      originalValue = state.grid[givenCell.row][givenCell.col];
    });

    when('I select that given cell and input a symbol', () => {
      if (!givenCell) {
        throw new Error('Given cell not found');
      }
      state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: givenCell });
      state = sudokuPlugin.handleAction(state, { type: 'input_symbol', payload: { symbol: state.puzzle.symbols[0] } });
    });

    then('the given cell should stay unchanged and lock feedback should appear', () => {
      if (!givenCell) {
        throw new Error('Given cell not found');
      }
      expect(state.grid[givenCell.row][givenCell.col]).toBe(originalValue);
      expect((state as SudokuState & { uiMessage?: string | null }).uiMessage).toBe('该格子为固定数字，无法修改。');
    });
  });

  test('Clearing selected editable cell does not alter givens', ({ given, when, then }) => {
    let state: SudokuState;
    let editableCell: { row: number; col: number } | null = null;
    let givenCell: { row: number; col: number } | null = null;
    let givenValue: SudokuCellValue = null;

    given('a sudoku game with selected editable and given cells', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 15 });
      editableCell = findEditableCell(state);
      givenCell = findGivenCell(state);
      if (!editableCell || !givenCell) {
        throw new Error('Required test cells not found');
      }
      givenValue = state.grid[givenCell.row][givenCell.col];
      state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: editableCell });
    });

    when('I input a symbol to the editable cell and then clear it', () => {
      state = sudokuPlugin.handleAction(state, { type: 'input_symbol', payload: { symbol: state.puzzle.symbols[0] } });
      state = sudokuPlugin.handleAction(state, { type: 'clear_cell' });
    });

    then('the editable cell should be empty and givens should remain unchanged', () => {
      if (!editableCell || !givenCell) {
        throw new Error('Required test cells not found');
      }
      expect(state.grid[editableCell.row][editableCell.col]).toBeNull();
      expect(state.grid[givenCell.row][givenCell.col]).toBe(givenValue);
    });
  });

  test('Fill-complete with wrong values highlights errors and keeps playing', ({ given, when, then }) => {
    let state: SudokuState;

    given('a sudoku game with editable cells', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 16 });
    });

    when('I fill all editable cells with at least one wrong value', () => {
      for (let row = 0; row < state.grid.length; row += 1) {
        for (let col = 0; col < state.grid[row].length; col += 1) {
          if (state.puzzle.givens[row][col] !== null) {
            continue;
          }
          const wrongSymbol = findWrongSymbol(state, row, col);
          state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: { row, col } });
          state = sudokuPlugin.handleAction(state, { type: 'input_symbol', payload: { symbol: wrongSymbol } });
        }
      }
    });

    then('the game should remain playing and show error cells', () => {
      expect(state.status).toBe('playing');
      expect(state.errorCells.length).toBeGreaterThan(0);
    });
  });

  test('Correcting all cells transitions to cleared', ({ given, when, then }) => {
    let state: SudokuState;
    let editableSnapshot: Array<{ row: number; col: number }> = [];

    given('a filled sudoku game with errors', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 17 });

      for (let row = 0; row < state.grid.length; row += 1) {
        for (let col = 0; col < state.grid[row].length; col += 1) {
          if (state.puzzle.givens[row][col] !== null) {
            continue;
          }
          editableSnapshot.push({ row, col });
          const wrongSymbol = findWrongSymbol(state, row, col);
          state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: { row, col } });
          state = sudokuPlugin.handleAction(state, { type: 'input_symbol', payload: { symbol: wrongSymbol } });
        }
      }
      expect(state.status).toBe('playing');
      expect(state.errorCells.length).toBeGreaterThan(0);
    });

    when('I replace editable cells with the correct solution symbols', () => {
      for (const { row, col } of editableSnapshot) {
        state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: { row, col } });
        state = sudokuPlugin.handleAction(state, {
          type: 'input_symbol',
          payload: { symbol: state.puzzle.solution[row][col] },
        });
      }
    });

    then('the game status should become cleared', () => {
      expect(state.status).toBe('cleared');
      expect(state.errorCells.length).toBe(0);
    });
  });
});
