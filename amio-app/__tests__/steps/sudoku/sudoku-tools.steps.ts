import { defineFeature, loadFeature } from 'jest-cucumber';
import sudokuPlugin, { SudokuState } from '@/games/sudoku';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/sudoku/sudoku-tools.feature');

defineFeature(feature, (test) => {
  test('Hint fills one cell and check is unavailable by default', ({ given, when, then }) => {
    let state: SudokuState;

    given('a sudoku game with tools', () => {
      state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 5 });
    });

    when('I use hint and check tools', () => {
      state = sudokuPlugin.useTool(state, 'hint');
      state = sudokuPlugin.useTool(state, 'check');
    });

    then('hint should consume one use and check should report unavailable', () => {
      expect(state.hintUsed).toBe(1);
      expect(state.lastUnavailableAction).toBe('check');
    });
  });
});
