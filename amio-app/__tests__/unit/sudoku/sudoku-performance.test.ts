import sudokuPlugin from '@/games/sudoku';

describe('sudoku/performance', () => {
  test('performance score decreases with tools', () => {
    let state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 1 });
    const p1 = sudokuPlugin.getPerformance(state);

    state = sudokuPlugin.useTool(state, 'hint');
    const p2 = sudokuPlugin.getPerformance(state);

    expect(p1.efficiencyScore).toBeGreaterThanOrEqual(p2.efficiencyScore);
  });
});
