import { defineFeature, loadFeature } from 'jest-cucumber';
import { ChestRatingEngine } from '@/engine/chest-rating';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/engine/chest-rating-engine.feature');

defineFeature(feature, (test) => {
  test('Rate chest level from thresholds and tool usage', ({ given, when, then }) => {
    const engine = new ChestRatingEngine();
    let result: string;

    given('a rating config and performance metrics', () => {
      result = 'bronze';
    });

    when('I evaluate chest level', () => {
      result = engine.rate(
        {
          efficiencyScore: 76,
          toolsUsed: 1,
          rawData: {},
        },
        {
          diamond: { minEfficiencyScore: 95, maxToolsUsed: 0 },
          gold: { minEfficiencyScore: 75, maxToolsUsed: 1 },
          silver: { minEfficiencyScore: 50, maxToolsUsed: 2 },
        }
      );
    });

    then('the result should match threshold boundaries', () => {
      expect(result).toBe('gold');
    });
  });
});
