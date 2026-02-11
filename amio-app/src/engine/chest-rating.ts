import { PerformanceMetrics, RatedChestLevel, RatingConfig } from '@/engine/types';

export class ChestRatingEngine {
  rate(performance: PerformanceMetrics, ratingConfig: RatingConfig): RatedChestLevel {
    if (
      performance.efficiencyScore >= ratingConfig.diamond.minEfficiencyScore &&
      performance.toolsUsed <= ratingConfig.diamond.maxToolsUsed
    ) {
      return 'diamond';
    }

    if (
      performance.efficiencyScore >= ratingConfig.gold.minEfficiencyScore &&
      performance.toolsUsed <= ratingConfig.gold.maxToolsUsed
    ) {
      return 'gold';
    }

    if (
      performance.efficiencyScore >= ratingConfig.silver.minEfficiencyScore &&
      performance.toolsUsed <= ratingConfig.silver.maxToolsUsed
    ) {
      return 'silver';
    }

    return 'bronze';
  }
}

export const chestRatingEngine = new ChestRatingEngine();
