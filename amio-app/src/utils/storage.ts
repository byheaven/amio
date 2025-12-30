import Taro from '@tarojs/taro';
import { ChestLevel } from '../constants/game';

/**
 * 待领取的宝箱
 */
export interface PendingChest {
    level: ChestLevel;
    earnedAt: string;      // ISO 时间戳
    unlockAt: string;      // 解锁时间（24小时后）
    expiresAt: string;     // 过期时间（解锁后24小时）
    isHeroBonus: boolean;  // 是否有Hero加成
}

/**
 * 游戏进度数据
 */
export interface GameProgress {
    todayDate: string;           // 当天日期 YYYY-MM-DD
    todayAttempts: number;       // 今日挑战次数
    todayCompleted: boolean;     // 今日是否通关
    todayChestLevel: ChestLevel | null; // 今日宝箱等级
    heroAttempted: boolean;      // 今日Hero是否已尝试
    heroCompleted: boolean;      // 今日Hero是否通关
    pendingChest: PendingChest | null; // 待领取宝箱
    consecutiveDays: number;     // 连续开箱天数
    lastClaimDate: string | null; // 上次领取日期
    totalDaysPlayed: number;     // 总游戏天数
}

const STORAGE_KEY = 'amio_game_progress';

/**
 * 获取今天的日期字符串
 */
export const getTodayDateString = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

/**
 * 创建初始进度数据
 */
export const createInitialProgress = (): GameProgress => ({
    todayDate: getTodayDateString(),
    todayAttempts: 0,
    todayCompleted: false,
    todayChestLevel: null,
    heroAttempted: false,
    heroCompleted: false,
    pendingChest: null,
    consecutiveDays: 0,
    lastClaimDate: null,
    totalDaysPlayed: 0,
});

/**
 * 加载游戏进度
 */
export const loadProgress = (): GameProgress => {
    try {
        const data = Taro.getStorageSync(STORAGE_KEY);
        if (data) {
            const progress: GameProgress = JSON.parse(data);
            // 检查是否是新的一天
            const today = getTodayDateString();
            if (progress.todayDate !== today) {
                // 新的一天，重置今日数据
                return {
                    ...progress,
                    todayDate: today,
                    todayAttempts: 0,
                    todayCompleted: false,
                    todayChestLevel: null,
                    heroAttempted: false,
                    heroCompleted: false,
                };
            }
            return progress;
        }
    } catch (error) {
        console.error('Failed to load progress:', error);
    }
    return createInitialProgress();
};

/**
 * 保存游戏进度
 */
export const saveProgress = (progress: GameProgress): void => {
    try {
        Taro.setStorageSync(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error('Failed to save progress:', error);
    }
};

/**
 * 更新今日游戏状态
 */
export const updateTodayStatus = (
    attempts: number,
    completed: boolean,
    chestLevel: ChestLevel | null,
    heroAttempted: boolean,
    heroCompleted: boolean
): void => {
    const progress = loadProgress();
    progress.todayAttempts = attempts;
    progress.todayCompleted = completed;
    progress.todayChestLevel = chestLevel;
    progress.heroAttempted = heroAttempted;
    progress.heroCompleted = heroCompleted;
    saveProgress(progress);
};

/**
 * 保存宝箱到待领取
 */
export const savePendingChest = (level: ChestLevel, isHeroBonus: boolean): void => {
    const progress = loadProgress();
    const now = new Date();

    // 如果已经有宝箱，只更新等级，不重置倒计时
    if (progress.pendingChest) {
        progress.pendingChest.level = level;
        progress.pendingChest.isHeroBonus = isHeroBonus;
    } else {
        // 新建宝箱
        const unlockAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24小时后解锁
        const expiresAt = new Date(unlockAt.getTime() + 24 * 60 * 60 * 1000); // 解锁后24小时过期
        progress.pendingChest = {
            level,
            earnedAt: now.toISOString(),
            unlockAt: unlockAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            isHeroBonus,
        };
        // 只在第一次创建宝箱时增加总天数
        progress.totalDaysPlayed += 1;
    }
    saveProgress(progress);
};

/**
 * 领取宝箱
 */
export const claimChest = (): PendingChest | null => {
    const progress = loadProgress();
    const chest = progress.pendingChest;

    if (!chest) return null;

    const now = new Date();
    const unlockAt = new Date(chest.unlockAt);
    const expiresAt = new Date(chest.expiresAt);

    // 检查是否已解锁
    if (now < unlockAt) {
        console.log('Chest not yet unlocked');
        return null;
    }

    // 检查是否已过期
    if (now > expiresAt) {
        console.log('Chest expired');
        progress.pendingChest = null;
        progress.consecutiveDays = 0; // 过期则连续天数归零
        saveProgress(progress);
        return null;
    }

    // 更新连续天数
    const today = getTodayDateString();
    if (progress.lastClaimDate) {
        const lastClaim = new Date(progress.lastClaimDate);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (progress.lastClaimDate === yesterdayStr) {
            progress.consecutiveDays += 1;
        } else if (progress.lastClaimDate !== today) {
            progress.consecutiveDays = 1;
        }
    } else {
        progress.consecutiveDays = 1;
    }

    progress.lastClaimDate = today;
    progress.pendingChest = null;
    saveProgress(progress);

    return chest;
};

/**
 * 获取宝箱状态
 */
export const getChestStatus = (): {
    status: 'none' | 'locked' | 'unlocked' | 'expired';
    chest: PendingChest | null;
    remainingTime: number; // 剩余时间（毫秒）
} => {
    const progress = loadProgress();
    const chest = progress.pendingChest;

    if (!chest) {
        return { status: 'none', chest: null, remainingTime: 0 };
    }

    const now = new Date();
    const unlockAt = new Date(chest.unlockAt);
    const expiresAt = new Date(chest.expiresAt);

    if (now > expiresAt) {
        return { status: 'expired', chest, remainingTime: 0 };
    }

    if (now < unlockAt) {
        return {
            status: 'locked',
            chest,
            remainingTime: unlockAt.getTime() - now.getTime(),
        };
    }

    return {
        status: 'unlocked',
        chest,
        remainingTime: expiresAt.getTime() - now.getTime(),
    };
};

/**
 * 获取连续保底奖励信息
 */
export const getStreakRewardInfo = (consecutiveDays: number): {
    nextMilestone: number;
    daysRemaining: number;
    reward: string;
} | null => {
    const milestones = [
        { days: 7, reward: '抽奖券×3' },
        { days: 14, reward: '实体贴纸包' },
        { days: 30, reward: '实体手链/挂件' },
        { days: 60, reward: '限定礼盒' },
    ];

    for (const milestone of milestones) {
        if (consecutiveDays < milestone.days) {
            return {
                nextMilestone: milestone.days,
                daysRemaining: milestone.days - consecutiveDays,
                reward: milestone.reward,
            };
        }
    }

    return null;
};

/**
 * 格式化剩余时间
 */
export const formatRemainingTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
