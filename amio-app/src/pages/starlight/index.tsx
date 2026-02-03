import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import PlanetView from '../../components/PlanetView';
import { loadProgress, saveProgress, createInitialProgress, claimChest, getChestStatus, getStreakRewardInfo, formatRemainingTime } from '../../utils/storage';
import { getChestLevelInfo, getChestRewardDetails } from '../../utils/chestLogic';
import { syncPlanetProgress } from '../../utils/energyLogic';
import type { GameProgress } from '../../utils/storage';
import { ChestLevel } from '../../constants/game';
import './index.scss';

const Starlight: React.FC = () => {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [planetProgress, setPlanetProgress] = useState(67.3);
  const [chestStatus, setChestStatus] = useState(getChestStatus());
  const [countdown, setCountdown] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState<number | null>(null);

  // 加载进度数据的函数
  const refreshProgress = () => {
    const loaded = loadProgress();
    setProgress(loaded);
    setChestStatus(getChestStatus());

    // Sync planet progress from server
    syncPlanetProgress().then(data => {
      setPlanetProgress(data.progress);
    });
  };

  // 页面挂载时加载
  useEffect(() => {
    refreshProgress();
  }, []);

  // 页面显示时刷新（从游戏页面返回时）
  useDidShow(() => {
    refreshProgress();
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

  const handleLightUp = () => {
    if (progress?.todayCompleted) {
      Taro.navigateTo({ url: '/pages/game/index?mode=hero' });
    } else {
      Taro.navigateTo({ url: '/pages/game/index?mode=normal' });
    }
  };

  const getButtonText = () => {
    if (!progress) return '点亮';
    if (progress.todayCompleted && progress.heroCompleted) return '明日再来点亮';
    if (progress.todayCompleted) return '挑战 Hero';
    return '点亮';
  };

  const isButtonDisabled = progress?.todayCompleted && progress?.heroCompleted;

  // 处理宝箱点击
  const handleChestClick = () => {
    if (!progress?.pendingChest) return;

    const status = getChestStatus();

    if (status.status === 'locked') {
      alert(`宝箱还在解锁中...\n剩余时间: ${countdown}`);
      return;
    }

    if (status.status === 'expired') {
      alert('宝箱已过期，明天继续努力吧！');
      const updated = { ...progress, pendingChest: null };
      saveProgress(updated);
      refreshProgress();
      return;
    }

    if (status.status === 'unlocked') {
      const chest = claimChest();
      if (chest) {
        const infos = chest.levels.map(level => getChestLevelInfo(level));
        const title = chest.levels.length > 1
          ? `获得 ${infos.map(i => i.emoji).join(' + ')}`
          : `获得 ${infos[0].emoji} ${infos[0].name}`;
        alert(`${title} 宝箱！\n能量已注入星球~`);
        refreshProgress();
      }
    }
  };

  // 点击宝箱显示/隐藏奖励提示
  const handleChestTooltip = (index: number, e: any) => {
    e.stopPropagation();
    setTooltipVisible(tooltipVisible === index ? null : index);
  };

  // 渲染宝箱奖励提示
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

  // 渲染hover提示
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

  // 调试功能：重置所有数据
  const handleReset = () => {
    if (confirm('确定要清空所有数据吗？')) {
      Taro.clearStorageSync();
      refreshProgress();
      alert('数据已重置');
    }
  };

  // 调试功能：一键过关（普通模式）
  const handleTestWin = () => {
    Taro.navigateTo({ url: '/pages/game/index?mode=normal&autowin=true' });
  };

  // 调试功能：查看状态
  const handleShowStatus = () => {
    console.log('Current Progress:', progress);
    alert(`今日完成: ${progress?.todayCompleted ? '是' : '否'}\nHero完成: ${progress?.heroCompleted ? '是' : '否'}\n连续天数: ${progress?.consecutiveDays}\n待领取宝箱: ${progress?.pendingChest ? progress.pendingChest.levels[0] : '无'}`);
  };

  // 调试功能：快速进入第二天（宝箱已解锁）
  const handleNextDay = () => {
    if (!progress) return;
    if (!confirm('确定要进入第二天吗？这将模拟宝箱已解锁状态。')) return;

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const existingLevel = progress.pendingChest?.levels?.[0] || 'GOLD';
    const existingLevels = progress.pendingChest?.levels || [existingLevel];
    const isHeroBonus = progress.pendingChest?.isHeroBonus || false;

    const unlockAt = new Date(yesterday.getTime());
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const updatedProgress: GameProgress = {
      ...progress,
      todayDate: yesterdayStr,
      todayCompleted: true,
      todayChestLevel: existingLevel,
      heroCompleted: true,
      consecutiveDays: progress.consecutiveDays + 1,
      lastCompletionDate: yesterdayStr,
      pendingChest: {
        levels: existingLevels,
        earnedAt: yesterday.toISOString(),
        unlockAt: unlockAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isHeroBonus,
      },
    };

    saveProgress(updatedProgress);
    refreshProgress();
    alert('已进入第二天状态，宝箱已解锁，可以领取！');
  };

  // 调试功能：跳过倒计时
  const handleSkipCountdown = () => {
    if (!progress) return;
    if (!progress.pendingChest) {
      alert('没有待开启宝箱');
      return;
    }
    const now = new Date();
    progress.pendingChest.unlockAt = new Date(now.getTime() - 1000).toISOString();
    progress.pendingChest.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    saveProgress(progress);
    refreshProgress();
    alert('倒计时已跳过，宝箱已解锁！');
  };

  if (!progress) return null;

  const chestInfos = chestStatus.chest ? chestStatus.chest.levels.map(level => getChestLevelInfo(level)) : null;
  const chestLevels = chestStatus.chest ? chestStatus.chest.levels : [];
  const streakInfo = getStreakRewardInfo(progress.consecutiveDays);

  return (
    <View className="starlight">
      {/* Top Status */}
      <View className="starlight__header">
        <View className="streak-badge">
          <Text className="streak-badge__icon">🔥</Text>
          <Text className="streak-badge__count">{progress.consecutiveDays}</Text>
        </View>
        <View className="debug-buttons">
          <Text className="debug-btn" onClick={handleReset}>🔄</Text>
          <Text className="debug-btn" onClick={handleTestWin}>🎯</Text>
          <Text className="debug-btn" onClick={handleSkipCountdown}>⏭️</Text>
          <Text className="debug-btn" onClick={handleNextDay}>📅</Text>
          <Text className="debug-btn" onClick={handleShowStatus}>📊</Text>
        </View>
      </View>

      {/* Introduction */}
      <View className="starlight__intro">
        <Text className="intro-text">完成每日挑战，点亮一束光，为鲨之星注入能量</Text>
      </View>

      {/* Planet Visualization */}
      <View className="starlight__planet">
        <PlanetView progress={planetProgress} size="large" />
      </View>

      {/* Chest Area */}
      <View className="starlight__chest">
        {chestStatus.status === 'none' && (
          <View className="chest-empty">
            <Text className="empty-text">今日还没有宝箱</Text>
            <Text className="empty-hint">完成今日挑战获得宝箱</Text>
          </View>
        )}

        {chestStatus.status === 'locked' && chestInfos && (
          <View className="chest-card chest-locked" onClick={handleChestClick}>
            <Text className="chest-card__label">✨ 来自星球的回馈</Text>
            <View className="chest-card__icons">
              {chestInfos.map((info, index) => (
                <View key={index} className="chest-icon-wrapper" onClick={(e) => handleChestTooltip(index, e)}>
                  <Text className="chest-icon">{info.emoji}</Text>
                  {renderHoverTooltip(chestLevels[index])}
                  {tooltipVisible === index && renderTooltip(chestLevels[index], index)}
                </View>
              ))}
            </View>
            <Text className="chest-name">
              {chestInfos.length > 1 ? chestInfos.map(i => i.name).join(' + ') : chestInfos[0].name}
            </Text>
            <View className="countdown-box">
              <Text className="countdown-label">🔒 解锁倒计时</Text>
              <Text className="countdown-time">{countdown}</Text>
            </View>
          </View>
        )}

        {chestStatus.status === 'unlocked' && chestInfos && (
          <View className="chest-card chest-unlocked" onClick={handleChestClick}>
            <Text className="chest-card__label">✨ 来自星球的回馈</Text>
            <View className="chest-card__icons">
              {chestInfos.map((info, index) => (
                <View key={index} className="chest-icon-wrapper" onClick={(e) => handleChestTooltip(index + 100, e)}>
                  <Text className="chest-icon glowing">{info.emoji}</Text>
                  {renderHoverTooltip(chestLevels[index])}
                  {tooltipVisible === index + 100 && renderTooltip(chestLevels[index], index)}
                </View>
              ))}
            </View>
            <Text className="chest-name">
              {chestInfos.length > 1 ? chestInfos.map(i => i.name).join(' + ') : chestInfos[0].name}
            </Text>
            <Button className="claim-btn" onClick={handleChestClick}>开启宝箱</Button>
            <Text className="expire-hint">⏰ {countdown} 后过期</Text>
          </View>
        )}

        {chestStatus.status === 'expired' && (
          <View className="chest-card chest-expired">
            <Text className="expired-text">😢 宝箱已过期</Text>
            <Text className="expired-hint">明天继续加油吧</Text>
          </View>
        )}
      </View>

      {/* Streak Milestones */}
      <View className="starlight__milestones">
        <View className="milestones-header">
          <Text className="milestones-title">🔥 连续点亮 {progress.consecutiveDays} 天</Text>
          {streakInfo.nextReward > 0 && (
            <Text className="milestones-subtitle">再坚持 {streakInfo.nextReward - progress.consecutiveDays} 天获得奖励</Text>
          )}
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
              className={`milestone-item ${progress.consecutiveDays >= milestone.days ? 'completed' : ''}`}
            >
              <Text className="milestone-check">
                {progress.consecutiveDays >= milestone.days ? '✅' : '⬜'}
              </Text>
              <Text className="milestone-text">
                连续通关{milestone.days}天，即可获得{milestone.reward}！
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Main Action Button */}
      <View className="starlight__action">
        <View
          className={`light-button ${isButtonDisabled ? 'light-button--disabled' : ''}`}
          onClick={!isButtonDisabled ? handleLightUp : undefined}
        >
          <Text className="light-button__text">{getButtonText()}</Text>
          <View className="light-button__glow" />
        </View>
        <Text className="today-theme">今日主题：那个四块钱的球拍 🏓</Text>
      </View>
    </View>
  );
};

export default Starlight;
