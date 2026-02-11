import { ChestRatingEngine } from '@/engine/chest-rating';

describe('engine/chest-rating', () => {
  const engine = new ChestRatingEngine();
  const config = {
    diamond: { minEfficiencyScore: 95, maxToolsUsed: 0 },
    gold: { minEfficiencyScore: 75, maxToolsUsed: 1 },
    silver: { minEfficiencyScore: 50, maxToolsUsed: 2 },
  };

  test('rates diamond', () => {
    expect(engine.rate({ efficiencyScore: 98, toolsUsed: 0, rawData: {} }, config)).toBe('diamond');
  });

  test('rates gold', () => {
    expect(engine.rate({ efficiencyScore: 80, toolsUsed: 1, rawData: {} }, config)).toBe('gold');
  });

  test('rates silver', () => {
    expect(engine.rate({ efficiencyScore: 60, toolsUsed: 2, rawData: {} }, config)).toBe('silver');
  });

  test('falls back to bronze', () => {
    expect(engine.rate({ efficiencyScore: 30, toolsUsed: 4, rawData: {} }, config)).toBe('bronze');
  });
});
