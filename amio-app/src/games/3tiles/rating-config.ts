import { RatingConfig } from '@/engine/types';

export const tilesRatingConfig: RatingConfig = {
  diamond: { minEfficiencyScore: 95, maxToolsUsed: 0 },
  gold: { minEfficiencyScore: 75, maxToolsUsed: 1 },
  silver: { minEfficiencyScore: 50, maxToolsUsed: 3 },
};
