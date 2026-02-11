import threeTilesPlugin from '@/games/3tiles';

describe('games/3tiles performance', () => {
  test('maps better result to higher efficiency score', () => {
    const state1 = threeTilesPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 1 });
    const p1 = threeTilesPlugin.getPerformance(state1);

    const state2 = {
      ...state1,
      attempts: 6,
      toolsUsed: 3,
    };
    const p2 = threeTilesPlugin.getPerformance(state2);

    expect(p1.efficiencyScore).toBeGreaterThan(p2.efficiencyScore);
  });
});
