import { ChestLevel, GameStats } from '../constants/game';

/**
 * 根据游戏表现计算宝箱等级
 *
 * 评定规则（来自PRD）:
 * | 挑战次数 | 0道具 | 1道具 | 2道具 | 3道具 |
 * |----------|-------|-------|-------|-------|
 * | 1次      | 💎    | 🥇    | 🥈    | 🥈    |
 * | 2次      | 🥇    | 🥇    | 🥈    | 🥈    |
 * | 3次      | 🥈    | 🥈    | 🥈    | 🥉    |
 * | 4-5次    | 🥈    | 🥈    | 🥉    | 🥉    |
 * | 6次+     | 🥉    | 🥉    | 🥉    | 🥉    |
 */
export function calculateChestLevel(stats: GameStats): ChestLevel {
  const { attempts, toolsUsed } = stats;

  // 1次通关
  if (attempts === 1) {
    if (toolsUsed === 0) return ChestLevel.DIAMOND;
    if (toolsUsed === 1) return ChestLevel.GOLD;
    return ChestLevel.SILVER;
  }

  // 2次通关
  if (attempts === 2) {
    if (toolsUsed <= 1) return ChestLevel.GOLD;
    return ChestLevel.SILVER;
  }

  // 3次通关
  if (attempts === 3) {
    if (toolsUsed <= 2) return ChestLevel.SILVER;
    return ChestLevel.BRONZE;
  }

  // 4-5次通关
  if (attempts >= 4 && attempts <= 5) {
    if (toolsUsed <= 1) return ChestLevel.SILVER;
    return ChestLevel.BRONZE;
  }

  // 6次及以上
  return ChestLevel.BRONZE;
}

/**
 * 获取宝箱等级的显示信息
 */
export function getChestLevelInfo(level: ChestLevel): {
  emoji: string;
  name: string;
  color: string;
} {
  switch (level) {
    case ChestLevel.DIAMOND:
      return { emoji: '💎', name: '钻石宝箱', color: '#00D4FF' };
    case ChestLevel.GOLD:
      return { emoji: '🥇', name: '黄金宝箱', color: '#FFD700' };
    case ChestLevel.SILVER:
      return { emoji: '🥈', name: '白银宝箱', color: '#C0C0C0' };
    case ChestLevel.BRONZE:
      return { emoji: '🥉', name: '青铜宝箱', color: '#CD7F32' };
  }
}

/**
 * Hero模式升级宝箱等级
 * - 青铜 → 白银 (+2级但不超过白银)
 * - 白银 → 黄金 (+2级但不超过黄金)
 * - 黄金 → 钻石 (+1级)
 * - 钻石 → 钻石+ (保持)
 */
export function upgradeChestForHero(originalLevel: ChestLevel): ChestLevel {
  switch (originalLevel) {
    case ChestLevel.BRONZE:
      return ChestLevel.SILVER;
    case ChestLevel.SILVER:
      return ChestLevel.GOLD;
    case ChestLevel.GOLD:
    case ChestLevel.DIAMOND:
      return ChestLevel.DIAMOND;
  }
}

/**
 * 创建初始游戏统计
 */
export function createInitialStats(): GameStats {
  return {
    attempts: 1,
    toolsUsed: 0,
    undoUsed: false,
    shuffleUsed: false,
    popUsed: false,
  };
}
