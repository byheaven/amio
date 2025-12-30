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
 * 获取宝箱奖励详情（用于tooltip显示）
 */
export function getChestRewardDetails(level: ChestLevel): {
  coins: string;
  props: string;
  lottery: string;
  physical: string;
}[] {
  switch (level) {
    case ChestLevel.DIAMOND:
      return [
        { coins: '金币×500', props: '道具×3', lottery: '抽奖券×2', physical: '10%实体周边' },
      ];
    case ChestLevel.GOLD:
      return [
        { coins: '金币×300', props: '道具×2', lottery: '抽奖券×1', physical: '3%实体周边' },
      ];
    case ChestLevel.SILVER:
      return [
        { coins: '金币×150', props: '道具×1', lottery: '5%抽奖券', physical: '' },
      ];
    case ChestLevel.BRONZE:
      return [
        { coins: '金币×50', props: '道具碎片', lottery: '', physical: '' },
      ];
  }
}

/**
 * Hero模式升级宝箱等级 (+2级，可能获得多个宝箱)
 * - 青铜 → 黄金 (1个)
 * - 白银 → 钻石 (1个)
 * - 黄金 → 钻石 + 黄金 (2个)
 * - 钻石 → 钻石 × 2 (2个)
 */
export function upgradeChestForHero(originalLevel: ChestLevel): ChestLevel[] {
  switch (originalLevel) {
    case ChestLevel.BRONZE:
      return [ChestLevel.GOLD];                          // 青铜 +2 → 黄金
    case ChestLevel.SILVER:
      return [ChestLevel.DIAMOND];                       // 白银 +2 → 钻石
    case ChestLevel.GOLD:
      return [ChestLevel.DIAMOND, ChestLevel.GOLD];      // 黄金 → 钻石 + 黄金
    case ChestLevel.DIAMOND:
      return [ChestLevel.DIAMOND, ChestLevel.DIAMOND];   // 钻石 → 钻石 × 2
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
