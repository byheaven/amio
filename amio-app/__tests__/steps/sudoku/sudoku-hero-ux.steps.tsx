import React from 'react';
import { render } from '@tarojs/test-utils-react/dist/pure';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { GameEngine } from '@/engine/game-engine';
import { gameRegistry } from '@/engine/game-registry';
import sudokuPlugin, { SudokuState } from '@/games/sudoku';
import HeroTimer from '@/games/sudoku/components/HeroTimer';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/sudoku/sudoku-hero-ux.feature');

defineFeature(feature, (test) => {
  test('Hero timer enters danger visual state at thirty seconds', ({ given, when, then }) => {
    let tree: ReturnType<typeof render> | null = null;

    given('a sudoku hero timer at thirty seconds remaining', () => {
      return;
    });

    when('I render the hero timer', () => {
      tree = render(<HeroTimer remainingSeconds={30} totalSeconds={180} />, {});
    });

    then('the timer should have danger visual state', () => {
      const root = tree?.container.querySelector('.hero-timer');
      expect(root).not.toBeNull();
      expect(root?.className).toContain('hero-timer--danger');
      expect(root?.getAttribute('data-danger')).toBe('true');
    });
  });

  test('Hero timer reaching zero transitions to failed', ({ given, when, then }) => {
    let state: SudokuState;

    given('a sudoku game in hero mode with remaining time', () => {
      state = sudokuPlugin.initGame({ mode: 'hero', date: '2026-02-11', seed: 20 });
      expect(state.remainingSeconds).toBeGreaterThan(0);
    });

    when('I tick hero timer to zero', () => {
      state = sudokuPlugin.handleAction(state, {
        type: 'tick',
        payload: { deltaSeconds: state.remainingSeconds },
      });
    });

    then('the sudoku game should become failed', () => {
      expect(state.status).toBe('failed');
      expect(state.remainingSeconds).toBe(0);
    });
  });

  test('Sudoku completion provides settlement payload', ({ given, when, then }) => {
    const engine = new GameEngine();
    let chestLevel = '';
    let efficiencyScore = 0;

    given('a sudoku game engine run', () => {
      gameRegistry.register(sudokuPlugin);
      engine.setGame('sudoku');
      engine.startGame({ mode: 'normal', date: '2026-02-11', userId: 'local-user', seed: 21 });
    });

    when('I complete the sudoku game and enter settlement', () => {
      const payload = engine.enterSettlement({
        gameId: 'sudoku',
        mode: 'normal',
        status: 'cleared',
        attempts: 1,
        durationSeconds: 100,
        toolsUsed: 0,
        heroAttempted: false,
      });
      chestLevel = payload.chestLevel;
      efficiencyScore = payload.performance.efficiencyScore;
    });

    then('settlement payload should include chest level and performance', () => {
      expect(['diamond', 'gold', 'silver', 'bronze']).toContain(chestLevel);
      expect(efficiencyScore).toBeGreaterThanOrEqual(0);
    });
  });
});
