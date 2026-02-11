import { GameScheduler } from '@/engine/game-scheduler';

describe('engine/game-scheduler', () => {
  test('alternates game type by date parity', () => {
    const scheduler = new GameScheduler();
    const d1 = scheduler.getTodayGameType('u1', '2026-02-10');
    const d2 = scheduler.getTodayGameType('u1', '2026-02-11');

    expect(d1).not.toBe(d2);
    expect([d1, d2].sort()).toEqual(['3tiles', 'sudoku']);
  });
});
