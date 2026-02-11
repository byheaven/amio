import { defineFeature, loadFeature } from 'jest-cucumber';
import sudokuPlugin, { SudokuState } from '@/games/sudoku';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/sudoku/sudoku-normal-play.feature');

defineFeature(feature, (test) => {
  test('Fill and clear editable cells while givens stay immutable', ({ given, when, then }) => {
    let state: SudokuState;
    let editablePos: { row: number; col: number } | null = null;
    let givenPos: { row: number; col: number } | null = null;

    given('a sudoku game in normal mode', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 2 });
      for (let row = 0; row < state.grid.length; row += 1) {
        for (let col = 0; col < state.grid[row].length; col += 1) {
          if (state.puzzle.givens[row][col] === null && !editablePos) {
            editablePos = { row, col };
          }
          if (state.puzzle.givens[row][col] !== null && !givenPos) {
            givenPos = { row, col };
          }
        }
      }
    });

    when('I select an editable cell and input then clear a symbol', () => {
      if (!editablePos) {
        throw new Error('Editable cell not found');
      }

      state = sudokuPlugin.handleAction(state, {
        type: 'select_cell',
        payload: editablePos,
      });
      state = sudokuPlugin.handleAction(state, {
        type: 'input_symbol',
        payload: { symbol: state.puzzle.symbols[0] },
      });
      state = sudokuPlugin.handleAction(state, {
        type: 'clear_cell',
      });

      if (givenPos) {
        state = sudokuPlugin.handleAction(state, {
          type: 'select_cell',
          payload: givenPos,
        });
        state = sudokuPlugin.handleAction(state, {
          type: 'input_symbol',
          payload: { symbol: state.puzzle.symbols[1] },
        });
      }
    });

    then('the cell value should change and given cells remain unchanged', () => {
      if (!editablePos) {
        throw new Error('Editable cell not found');
      }
      expect(state.grid[editablePos.row][editablePos.col]).toBeNull();
      if (givenPos) {
        expect(state.grid[givenPos.row][givenPos.col]).toBe(state.puzzle.givens[givenPos.row][givenPos.col]);
      }
    });
  });
});
