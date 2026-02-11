import { RatingConfig } from '@/engine/types';

export const sudokuRatingConfig: RatingConfig = {
  diamond: { minEfficiencyScore: 90, maxToolsUsed: 0 },
  gold: { minEfficiencyScore: 70, maxToolsUsed: 1 },
  silver: { minEfficiencyScore: 40, maxToolsUsed: 2 },
};
