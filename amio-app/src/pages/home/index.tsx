import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
    loadProgress,
    getChestStatus,
    getStreakRewardInfo,
    formatRemainingTime,
    claimChest,
    createInitialProgress,
    saveProgress,
} from '../../utils/storage';
import { getChestLevelInfo, getChestRewardDetails } from '../../utils/chestLogic';
import { ChestLevel } from '../../constants/game';
import './index.scss';
import { ChestRewardModal } from '../../components/ChestRewardModal';

const Home: React.FC = () => {
    const [progress, setProgress] = useState(loadProgress());
    const [chestStatus, setChestStatus] = useState(getChestStatus());
    const [countdown, setCountdown] = useState('');
    const [tooltipVisible, setTooltipVisible] = useState<number | null>(null);
    const [rewardModalVisible, setRewardModalVisible] = useState(false);
    const [rewardChestLevels, setRewardChestLevels] = useState<ChestLevel[]>([]);

    // 页面显示时刷新数据（从游戏页面返回时）
    useDidShow(() => {
        const newProgress = loadProgress();
        console.log('Home useDidShow - progress:', newProgress);
        setProgress(newProgress);
        setChestStatus(getChestStatus());
    });

    // 更新倒计时
    useEffect(() => {
        const updateCountdown = () => {
            const status = getChestStatus();
            setChestStatus(status);
            if (status.remainingTime > 0) {
                setCountdown(formatRemainingTime(status.remainingTime));
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, []);

    const startGame = (heroMode: boolean = false) => {
        Taro.navigateTo({ url: `/pages/game/index?mode=${heroMode ? 'hero' : 'normal'}` });
    };

    // 重置游戏进度（测试用）
    const handleReset = () => {
        saveProgress(createInitialProgress());
        setProgress(loadProgress());
        setChestStatus(getChestStatus());
        Taro.showToast({ title: '已重置', icon: 'success' });
    };

    // 跳过倒计时（测试用）- 让宝箱立即可开启
    const handleSkipCountdown = () => {
        const currentProgress = loadProgress();
        if (currentProgress.pendingChest) {
            // 把unlockAt设置为过去的时间，让宝箱立即可开启
            const now = new Date();
            currentProgress.pendingChest.unlockAt = new Date(now.getTime() - 1000).toISOString();
            // 保持expiresAt在未来，给用户时间开启
            currentProgress.pendingChest.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            saveProgress(currentProgress);
            setProgress(loadProgress());
            setChestStatus(getChestStatus());
            Taro.showToast({ title: '倒计时已跳过', icon: 'success' });
        } else {
            Taro.showToast({ title: '没有待开启宝箱', icon: 'none' });
        }
    };

    // 模拟进入第二天（测试用）
    const handleNextDay = () => {
        const currentProgress = loadProgress();
        // 把今天的日期设为昨天，这样下次加载时会触发新一天的重置
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        currentProgress.todayDate = yesterdayStr;

        // 同时把lastCompletionDate也往前推一天，保持连续性
        if (currentProgress.lastCompletionDate) {
            const lastCompletion = new Date(currentProgress.lastCompletionDate);
            lastCompletion.setDate(lastCompletion.getDate() - 1);
            currentProgress.lastCompletionDate = `${lastCompletion.getFullYear()}-${String(lastCompletion.getMonth() + 1).padStart(2, '0')}-${String(lastCompletion.getDate()).padStart(2, '0')}`;
        }

        // 同时把lastClaimDate也往前推一天
        if (currentProgress.lastClaimDate) {
            const lastClaim = new Date(currentProgress.lastClaimDate);
            lastClaim.setDate(lastClaim.getDate() - 1);
            currentProgress.lastClaimDate = `${lastClaim.getFullYear()}-${String(lastClaim.getMonth() + 1).padStart(2, '0')}-${String(lastClaim.getDate()).padStart(2, '0')}`;
        }

        // 处理待领取的宝箱 - 将所有时间往前推一天（模拟已经过了一天）
        if (currentProgress.pendingChest) {
            const chest = currentProgress.pendingChest;
            // 将所有时间戳往前推一天
            const earnedAt = new Date(chest.earnedAt);
            earnedAt.setDate(earnedAt.getDate() - 1);
            chest.earnedAt = earnedAt.toISOString();

            const unlockAt = new Date(chest.unlockAt);
            unlockAt.setDate(unlockAt.getDate() - 1);
            chest.unlockAt = unlockAt.toISOString();

            const expiresAt = new Date(chest.expiresAt);
            expiresAt.setDate(expiresAt.getDate() - 1);
            chest.expiresAt = expiresAt.toISOString();
        }

        saveProgress(currentProgress);
        setProgress(loadProgress());
        setChestStatus(getChestStatus());
        Taro.showToast({ title: '已进入第二天', icon: 'success' });
    };

    const handleClaimChest = () => {
        const claimed = claimChest();
        if (claimed) {
            // 设置奖励宝箱等级并打开弹窗
            setRewardChestLevels(claimed.levels);
            setRewardModalVisible(true);

            // 刷新状态 (claimedChest会在claimChest()内部自动清除pendingChest，所以getChestStatus()会返回none)
            setProgress(loadProgress());
            setChestStatus(getChestStatus());
        }
    };

    const handleRewardModalClose = () => {
        setRewardModalVisible(false);
    };

    // 显示的连续天数（现在在通关时就已计算，无需+1）
    const displayStreak = progress.consecutiveDays;
    const streakInfo = getStreakRewardInfo(displayStreak);
    const chestInfos = chestStatus.chest ? chestStatus.chest.levels.map(level => getChestLevelInfo(level)) : null;
    const chestLevels = chestStatus.chest ? chestStatus.chest.levels : [];

    // 点击宝箱显示/隐藏奖励提示
    const handleChestClick = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setTooltipVisible(tooltipVisible === index ? null : index);
    };

    // 点击其他地方关闭提示
    const handlePageClick = () => {
        setTooltipVisible(null);
    };

    // 渲染宝箱奖励提示内容 (点击版)
    const renderTooltip = (level: ChestLevel, index: number) => {
        const rewards = getChestRewardDetails(level)[0];
        const info = getChestLevelInfo(level);
        return (
            <View className="chest-tooltip" onClick={(e) => e.stopPropagation()}>
                <Text className="tooltip-title">{info.emoji} {info.name}可能包含：</Text>
                <View className="tooltip-rewards">
                    <Text className="tooltip-item">💰 {rewards.coins}</Text>
                    <Text className="tooltip-item">🧰 {rewards.props}</Text>
                    {rewards.lottery && <Text className="tooltip-item">🎫 {rewards.lottery}</Text>}
                    {rewards.physical && <Text className="tooltip-item">🎁 {rewards.physical}</Text>}
                </View>
            </View>
        );
    };

    // 渲染hover提示（CSS控制显示，始终存在于DOM中）
    const renderHoverTooltip = (level: ChestLevel) => {
        const rewards = getChestRewardDetails(level)[0];
        const info = getChestLevelInfo(level);
        return (
            <View className="chest-tooltip-hover">
                <Text className="tooltip-title">{info.emoji} {info.name}可能包含：</Text>
                <View className="tooltip-rewards">
                    <Text className="tooltip-item">💰 {rewards.coins}</Text>
                    <Text className="tooltip-item">🧰 {rewards.props}</Text>
                    {rewards.lottery && <Text className="tooltip-item">🎫 {rewards.lottery}</Text>}
                    {rewards.physical && <Text className="tooltip-item">🎁 {rewards.physical}</Text>}
                </View>
            </View>
        );
    };

    return (
        <View className="home-page" onClick={handlePageClick}>
            <ChestRewardModal
                visible={rewardModalVisible}
                chestLevels={rewardChestLevels}
                onClose={handleRewardModalClose}
            />
            {/* 顶部区域 */}
            <View className="header-section">
                <Text className="title">🦈 鲨之星</Text>
                <Text className="subtitle">SHARK STAR</Text>
                <View className="day-row">
                    <Text className="day-counter">
                        Day {progress.todayCompleted ? progress.totalDaysPlayed : progress.totalDaysPlayed + 1}
                    </Text>
                    <Text className="reset-btn" onClick={handleReset}>🔄</Text>
                    <Text className="reset-btn" onClick={handleSkipCountdown}>⏭️</Text>
                    <Text className="reset-btn" onClick={handleNextDay}>📅</Text>
                </View>
            </View>

            {/* 宝箱状态区域 */}
            <View className="chest-section">
                <Text className="section-title">📦 我的宝箱</Text>

                {chestStatus.status === 'none' && (
                    <View className="chest-empty">
                        <Text className="empty-text">今日还没有宝箱</Text>
                        <Text className="empty-hint">完成今日挑战获得宝箱</Text>
                    </View>
                )}

                {chestStatus.status === 'locked' && chestInfos && (
                    <View className="chest-locked">
                        <View className="chest-icons-row">
                            {chestInfos.map((info, index) => (
                                <View
                                    key={index}
                                    className="chest-icon-wrapper"
                                    onClick={(e) => handleChestClick(index, e)}
                                >
                                    <View className="chest-icon">
                                        <Text className="chest-emoji">{info.emoji}</Text>
                                    </View>
                                    {renderHoverTooltip(chestLevels[index])}
                                    {tooltipVisible === index && renderTooltip(chestLevels[index], index)}
                                </View>
                            ))}
                        </View>
                        <Text className="chest-name">
                            {chestInfos.length > 1
                                ? chestInfos.map(i => i.name).join(' + ')
                                : chestInfos[0].name
                            }
                        </Text>
                        <View className="countdown-box">
                            <Text className="countdown-label">🔒 解锁倒计时</Text>
                            <Text className="countdown-time">{countdown}</Text>
                        </View>
                    </View>
                )}

                {chestStatus.status === 'unlocked' && chestInfos && (
                    <View className="chest-unlocked">
                        <View className="chest-icons-row">
                            {chestInfos.map((info, index) => (
                                <View
                                    key={index}
                                    className="chest-icon-wrapper"
                                    onClick={(e) => handleChestClick(index + 100, e)}
                                >
                                    <View className="chest-icon glowing">
                                        <Text className="chest-emoji">{info.emoji}</Text>
                                    </View>
                                    {renderHoverTooltip(chestLevels[index])}
                                    {tooltipVisible === index + 100 && renderTooltip(chestLevels[index], index)}
                                </View>
                            ))}
                        </View>
                        <Text className="chest-name">
                            {chestInfos.length > 1
                                ? chestInfos.map(i => i.name).join(' + ')
                                : chestInfos[0].name
                            }
                        </Text>
                        <Button className="claim-btn" onClick={handleClaimChest}>
                            开启宝箱
                        </Button>
                        <Text className="expire-hint">⏰ {countdown} 后过期</Text>
                    </View>
                )}

                {chestStatus.status === 'expired' && (
                    <View className="chest-expired">
                        <Text className="expired-text">😢 宝箱已过期</Text>
                        <Text className="expired-hint">明天继续加油吧</Text>
                    </View>
                )}
            </View>

            {/* 连续天数区域 */}
            <View className="streak-section">
                <View className="streak-info">
                    <Text className="streak-icon">🔥</Text>
                    <Text className="streak-days">连续 {displayStreak} 天</Text>
                </View>
                <View className="milestones-list">
                    {[
                        { days: 7, reward: '实体周边奖励' },
                        { days: 14, reward: '实体贴纸包' },
                        { days: 30, reward: '实体手链/挂件' },
                        { days: 60, reward: '限定礼盒' },
                    ].map((milestone) => (
                        <View
                            key={milestone.days}
                            className={`milestone-item ${displayStreak >= milestone.days ? 'completed' : ''}`}
                        >
                            <Text className="milestone-check">
                                {displayStreak >= milestone.days ? '✅' : '⬜'}
                            </Text>
                            <Text className="milestone-text">
                                连续通关{milestone.days}天，即可获得{milestone.reward}！
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* 开始按钮 */}
            <View className="action-section">
                {progress.todayCompleted ? (
                    <View className="completed-badge">
                        <Text className="completed-text">✅ 今日已通关</Text>
                        {!progress.heroCompleted && (
                            <Button className="hero-btn" onClick={() => startGame(true)}>
                                挑战Hero模式
                            </Button>
                        )}
                    </View>
                ) : (
                    <Button className="start-btn" onClick={() => startGame(false)}>
                        🎮 开始今日挑战
                    </Button>
                )}
            </View>
        </View>
    );
};

export default Home;
