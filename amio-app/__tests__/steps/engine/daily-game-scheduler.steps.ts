import { defineFeature, loadFeature } from 'jest-cucumber';
import { GameScheduler } from '@/engine/game-scheduler';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/engine/daily-game-scheduler.feature');

defineFeature(feature, (test) => {
  test('Scheduler deterministic alternation', ({ given, when, then }) => {
    const scheduler = new GameScheduler();
    let first = '';
    let second = '';

    given('two consecutive dates for the same user', () => {
      first = '';
      second = '';
    });

    when('I query the scheduler', () => {
      first = scheduler.getTodayGameType('u1', '2026-02-10');
      second = scheduler.getTodayGameType('u1', '2026-02-11');
    });

    then('game type should alternate between 3tiles and sudoku', () => {
      expect(first).not.toBe(second);
      expect([first, second].sort()).toEqual(['3tiles', 'sudoku']);
    });
  });
});
