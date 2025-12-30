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
import { getChestLevelInfo } from '../../utils/chestLogic';
import './index.scss';

const Home: React.FC = () => {
    const [progress, setProgress] = useState(loadProgress());
    const [chestStatus, setChestStatus] = useState(getChestStatus());
    const [countdown, setCountdown] = useState('');

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

    const handleClaimChest = () => {
        const claimed = claimChest();
        if (claimed) {
            const infos = claimed.levels.map(level => getChestLevelInfo(level));
            const title = claimed.levels.length > 1
                ? `获得 ${infos.map(i => i.emoji).join(' + ')}`
                : `获得 ${infos[0].emoji} ${infos[0].name}`;
            Taro.showToast({
                title,
                icon: 'success',
            });
            setProgress(loadProgress());
            setChestStatus(getChestStatus());
        }
    };

    const streakInfo = getStreakRewardInfo(progress.consecutiveDays);
    const chestInfos = chestStatus.chest ? chestStatus.chest.levels.map(level => getChestLevelInfo(level)) : null;

    return (
        <View className="home-page">
            {/* 顶部区域 */}
            <View className="header-section">
                <Text className="title">🦈 鲨之星</Text>
                <Text className="subtitle">SHARK STAR</Text>
                <View className="day-row">
                    <Text className="day-counter">
                        Day {progress.todayCompleted ? progress.totalDaysPlayed : progress.totalDaysPlayed + 1}
                    </Text>
                    <Text className="reset-btn" onClick={handleReset}>🔄</Text>
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
                                <View key={index} className="chest-icon">
                                    <Text className="chest-emoji">{info.emoji}</Text>
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
                                <View key={index} className="chest-icon glowing">
                                    <Text className="chest-emoji">{info.emoji}</Text>
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
                    <Text className="streak-days">连续 {progress.consecutiveDays} 天</Text>
                </View>
                {streakInfo && (
                    <View className="streak-reward">
                        <Text className="reward-hint">
                            再坚持 {streakInfo.daysRemaining} 天 → {streakInfo.reward}
                        </Text>
                    </View>
                )}
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
