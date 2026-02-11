import { defineFeature, loadFeature } from 'jest-cucumber';
import { GameEngine } from '@/engine/game-engine';
import { gameRegistry } from '@/engine/game-registry';
import sudokuPlugin from '@/games/sudoku';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/sudoku/sudoku-plugin-integration.feature');

defineFeature(feature, (test) => {
  test('Sudoku plugin can run through game engine and settlement', ({ given, when, then }) => {
    const engine = new GameEngine();
    let chestLevel = '';

    given('a game engine with sudoku plugin', () => {
      gameRegistry.register(sudokuPlugin);
      engine.setGame('sudoku');
    });

    when('I start and finish a sudoku game', () => {
      let state = engine.startGame({ mode: 'normal', date: '2026-02-11', userId: 'local-user', seed: 99 });
      state = {
        ...state,
        status: 'cleared',
        endedAt: Date.now(),
      };
      const payload = engine.enterSettlement({
        gameId: 'sudoku',
        mode: 'normal',
        status: 'cleared',
        attempts: 1,
        durationSeconds: 90,
        toolsUsed: 0,
        heroAttempted: false,
      });
      chestLevel = payload.chestLevel;
    });

    then('settlement should be generated successfully', () => {
      expect(['diamond', 'gold', 'silver', 'bronze']).toContain(chestLevel);
    });
  });
});
