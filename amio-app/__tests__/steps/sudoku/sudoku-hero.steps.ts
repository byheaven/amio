import { defineFeature, loadFeature } from 'jest-cucumber';
import sudokuPlugin, { SudokuState } from '@/games/sudoku';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/sudoku/sudoku-hero.feature');

defineFeature(feature, (test) => {
  test('Hero mode fails when timer reaches zero', ({ given, when, then }) => {
    let state: SudokuState;

    given('a sudoku game in hero mode', () => {
      state = sudokuPlugin.initGame({ mode: 'hero', date: '2026-02-11', seed: 9 });
    });

    when('timer ticks down past zero', () => {
      state = sudokuPlugin.handleAction(state, {
        type: 'tick',
        payload: { deltaSeconds: 200 },
      });
    });

    then('game status should become failed', () => {
      expect(state.status).toBe('failed');
      expect(state.remainingSeconds).toBe(0);
    });
  });
});
