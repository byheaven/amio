import Taro from '@tarojs/taro';
import { ChestLevel } from '../constants/game';

/**
 * 待领取的宝箱
 */
export interface PendingChest {
    levels: ChestLevel[];  // 宝箱等级数组（Hero模式可能获得多个）
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
    consecutiveDays: number;     // 连续通关天数
    lastCompletionDate: string | null; // 上次通关日期
    lastClaimDate: string | null; // 上次领取日期
    totalDaysPlayed: number;     // 总游戏天数
    storyProgress: number;       // 已解锁到第几天的故事
    viewedStories: number[];     // 已观看的故事日期列表
    hasSeenIntro: boolean;       // 是否已观看开场剧情
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
    lastCompletionDate: null,
    lastClaimDate: null,
    totalDaysPlayed: 0,
    storyProgress: 0,
    viewedStories: [],
    hasSeenIntro: false,
});

/**
 * 加载游戏进度
 */
export const loadProgress = (): GameProgress => {
    try {
        const data = Taro.getStorageSync(STORAGE_KEY);
        if (data) {
            const progress: GameProgress = JSON.parse(data);

            // 数据迁移：将旧的 level 字段转换为 levels 数组
            if (progress.pendingChest) {
                const chest = progress.pendingChest as any;
                if (chest.level !== undefined && chest.levels === undefined) {
                    chest.levels = [chest.level];
                    delete chest.level;
                }
            }

            // 数据迁移：添加 lastCompletionDate 字段（如果不存在）
            if (progress.lastCompletionDate === undefined) {
                progress.lastCompletionDate = null;
            }

            // 数据迁移：添加故事进度字段（如果不存在）
            if (progress.storyProgress === undefined) {
                progress.storyProgress = 0;
            }
            if (progress.viewedStories === undefined) {
                progress.viewedStories = [];
            }
            if (progress.hasSeenIntro === undefined) {
                progress.hasSeenIntro = false;
            }

            // 检查是否是新的一天
            const today = getTodayDateString();
            if (progress.todayDate !== today) {
                // 新的一天，重置今日数据
                const newProgress: GameProgress = {
                    ...progress,
                    todayDate: today,
                    todayAttempts: 0,
                    todayCompleted: false,
                    todayChestLevel: null,
                    heroAttempted: false,
                    heroCompleted: false,
                };
                // 保存新一天的进度，确保后续操作基于正确的日期
                saveProgress(newProgress);
                return newProgress;
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
 * 更新今日游戏状态（通关时调用）
 * 这里处理streak和day counter的逻辑，与宝箱无关
 */
export const updateTodayStatus = (
    attempts: number,
    completed: boolean,
    chestLevel: ChestLevel | null,
    heroAttempted: boolean,
    heroCompleted: boolean
): void => {
    const progress = loadProgress();
    const wasCompletedBefore = progress.todayCompleted;
    const now = new Date();
    const today = getTodayDateString();

    progress.todayAttempts = attempts;
    progress.todayCompleted = completed;
    progress.todayChestLevel = chestLevel;
    progress.heroAttempted = heroAttempted;
    progress.heroCompleted = heroCompleted;

    // 如果是今天第一次通关，更新streak和day counter
    if (completed && !wasCompletedBefore) {
        // 增加总天数
        progress.totalDaysPlayed += 1;

        // 更新连续通关天数
        if (progress.lastCompletionDate) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

            if (progress.lastCompletionDate === yesterdayStr) {
                // 昨天也通关了，连续+1
                progress.consecutiveDays += 1;
            } else if (progress.lastCompletionDate !== today) {
                // 不是昨天也不是今天，重置为1
                progress.consecutiveDays = 1;
            }
        } else {
            // 第一次通关
            progress.consecutiveDays = 1;
        }
        progress.lastCompletionDate = today;
    }

    saveProgress(progress);
};

/**
 * 保存宝箱到待领取（通关时调用）
 * 注意：宝箱只是奖励，streak和day counter由updateTodayStatus处理
 */
export const savePendingChest = (levels: ChestLevel[], isHeroBonus: boolean): void => {
    const progress = loadProgress();
    const now = new Date();
    const today = getTodayDateString();

    // 检查是否有今天的宝箱（通过earnedAt日期判断）
    let isTodayChest = false;
    if (progress.pendingChest) {
        const earnedDate = new Date(progress.pendingChest.earnedAt);
        const earnedDateStr = `${earnedDate.getFullYear()}-${String(earnedDate.getMonth() + 1).padStart(2, '0')}-${String(earnedDate.getDate()).padStart(2, '0')}`;
        isTodayChest = (earnedDateStr === today);
    }

    if (progress.pendingChest && isTodayChest) {
        // 今天已经有宝箱了，只更新等级（Hero模式升级等情况）
        progress.pendingChest.levels = levels;
        progress.pendingChest.isHeroBonus = isHeroBonus;
    } else {
        // 新建今天的宝箱（替换旧的未领取宝箱）
        const unlockAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24小时后解锁
        const expiresAt = new Date(unlockAt.getTime() + 24 * 60 * 60 * 1000); // 解锁后24小时过期
        progress.pendingChest = {
            levels,
            earnedAt: now.toISOString(),
            unlockAt: unlockAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            isHeroBonus,
        };
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
        // 注意：过期不再重置连续天数，连续天数由通关决定
        saveProgress(progress);
        return null;
    }

    // 成功领取
    const today = getTodayDateString();
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

/**
 * 获取下一个要展示的故事天数
 * 返回 0 表示没有新故事需要展示
 */
export const getNextStoryDay = (): number => {
    const progress = loadProgress();
    const nextDay = progress.storyProgress + 1;

    // 检查这个故事是否已经观看过
    if (progress.viewedStories.includes(nextDay)) {
        return 0;
    }

    return nextDay;
};

/**
 * 标记故事已观看
 */
export const markStoryViewed = (day: number): void => {
    const progress = loadProgress();

    // 添加到已观看列表
    if (!progress.viewedStories.includes(day)) {
        progress.viewedStories.push(day);
    }

    // 更新故事进度
    if (day > progress.storyProgress) {
        progress.storyProgress = day;
    }

    saveProgress(progress);
};

/**
 * 标记开场剧情已观看
 */
export const markIntroSeen = (): void => {
    const progress = loadProgress();
    progress.hasSeenIntro = true;
    saveProgress(progress);
};

