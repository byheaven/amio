import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import PlanetView from '@/components/PlanetView';
import TodayGameCard, { TodayCardState, TodayGameCardDisplayContext } from '@/components/TodayGameCard';
import StreakMilestones from '@/components/StreakMilestones';
import { GameEngine } from '@/engine/game-engine';
import { uiEventLogger } from '@/services/ui-event-logger';
import { registerBuiltInGames } from '@/games/registry';
import {
  advanceDebugDateByDays,
  claimChest,
  formatRemainingTime,
  getChestStatus,
  getTodayDateString,
  loadProgress,
  saveProgress,
} from '@/utils/storage';
import { getChestLevelInfo, getChestRewardDetails } from '@/utils/chestLogic';
import { syncPlanetProgress } from '@/utils/energyLogic';
import type { GameProgress } from '@/utils/storage';
import { ChestLevel } from '@/constants/game';
import './index.scss';

const USER_ID = 'local-user';
const isDebugUiEnabled = process.env.NODE_ENV !== 'production';

const deriveCardState = (progress: GameProgress): TodayCardState => {
  if (!progress.todayCompleted) {
    return 'idle';
  }
  if (!progress.heroAttempted) {
    return 'completed';
  }
  if (progress.heroAttempted && !progress.heroCompleted) {
    return 'hero';
  }
  return 'done';
};

const navigateToStarOcean = (): void => {
  Taro.switchTab({
    url: '/pages/starocean/index',
    fail: (error) => {
      console.error('Navigation to starocean failed:', error);
      Taro.reLaunch({ url: '/pages/starocean/index' });
    },
  });
};

const getCardDisplayContext = (
  cardState: TodayCardState,
  energyReward: number,
  chestLabel?: string
): TodayGameCardDisplayContext => {
  const defaultContext: TodayGameCardDisplayContext = {
    badgeText: '今日任务',
    energyLabel: `+${energyReward} 星能`,
    chestStatLabel: chestLabel ? `宝箱 ${chestLabel}` : undefined,
    journeyHint: '每天玩一局，都会给星球补充一点光。',
    startActionLabel: '开始今日挑战',
    heroActionLabel: '挑战英雄模式',
    doneActionLabel: '前往星海继续探索',
    closeActionLabel: '前往星海继续探索',
  };

  if (cardState === 'playing') {
    return {
      ...defaultContext,
      badgeText: '进行中',
      journeyHint: '进度已保存，继续这一局吧。',
      startActionLabel: '继续挑战',
    };
  }

  if (cardState === 'completed') {
    return {
      ...defaultContext,
      badgeText: '已通关',
      chestStatLabel: undefined,
      journeyHint: '可继续挑战英雄模式，或先去星海逛逛。',
    };
  }

  if (cardState === 'hero') {
    return {
      ...defaultContext,
      badgeText: '英雄模式进行中',
      chestStatLabel: undefined,
      journeyHint: '英雄模式失败不会扣掉基础宝箱，请放心挑战。',
    };
  }

  if (cardState === 'done') {
    return {
      ...defaultContext,
      badgeText: '今日完成',
      chestStatLabel: undefined,
      journeyHint: '今天的星光已点亮，去星海看看新的变化吧。',
    };
  }

  return defaultContext;
};

const Starlight: React.FC = () => {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [planetProgress, setPlanetProgress] = useState(67.3);
  const [chestStatus, setChestStatus] = useState(getChestStatus());
  const [countdown, setCountdown] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState<number | null>(null);
  const [cardState, setCardState] = useState<TodayCardState>('idle');
  const [todayDate, setTodayDate] = useState(getTodayDateString());
  const ctaExposeKeyRef = useRef('');

  const engine = useMemo(() => {
    registerBuiltInGames();
    return new GameEngine();
  }, []);

  const todayGame = useMemo(() => {
    return engine.getTodayGame(USER_ID, todayDate);
  }, [engine, todayDate]);

  const refreshProgress = () => {
    const effectiveDate = getTodayDateString();
    setTodayDate(effectiveDate);

    const loaded = loadProgress();
    setProgress(loaded);
    setChestStatus(getChestStatus());
    setCardState(deriveCardState(loaded));

    syncPlanetProgress()
      .then((data) => {
        setPlanetProgress(data.progress);
      })
      .catch((error) => {
        console.error('Failed to sync planet progress:', error);
      });
  };

  useEffect(() => {
    refreshProgress();
  }, []);

  useDidShow(() => {
    refreshProgress();
  });

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

  useEffect(() => {
    const ctaType = cardState === 'completed' ? 'hero' : cardState === 'idle' || cardState === 'playing' ? 'start' : null;
    if (!ctaType) {
      return;
    }

    const exposeKey = `${todayDate}:${todayGame.id}:${cardState}:${ctaType}`;
    if (ctaExposeKeyRef.current === exposeKey) {
      return;
    }

    ctaExposeKeyRef.current = exposeKey;
    uiEventLogger.append({
      userId: USER_ID,
      date: todayDate,
      event: 'starlight_cta_exposed',
      metadata: {
        cardState,
        ctaType,
        gameType: todayGame.id,
      },
    });

    if (cardState === 'completed') {
      uiEventLogger.append({
        userId: USER_ID,
        date: todayDate,
        event: 'hero_prompt_shown',
        metadata: {
          gameType: todayGame.id,
        },
      });
    }
  }, [cardState, todayDate, todayGame.id]);

  const handlePlanetClick = () => {
    Taro.navigateTo({ url: '/pages/world/index' });
  };

  const handleStart = () => {
    uiEventLogger.append({
      userId: USER_ID,
      date: todayDate,
      event: 'starlight_cta_clicked',
      metadata: {
        cardState,
        ctaType: 'start',
        gameType: todayGame.id,
      },
    });

    setCardState('playing');
    Taro.navigateTo({ url: `/pages/game/index?mode=normal&gameType=${todayGame.id}` });
  };

  const handleHero = () => {
    uiEventLogger.append({
      userId: USER_ID,
      date: todayDate,
      event: 'starlight_cta_clicked',
      metadata: {
        cardState,
        ctaType: 'hero',
        gameType: todayGame.id,
      },
    });
    uiEventLogger.append({
      userId: USER_ID,
      date: todayDate,
      event: 'hero_prompt_clicked',
      metadata: {
        gameType: todayGame.id,
      },
    });

    setCardState('hero');
    Taro.navigateTo({ url: `/pages/game/index?mode=hero&gameType=${todayGame.id}` });
  };

  const handleGoToStarOcean = () => {
    uiEventLogger.append({
      userId: USER_ID,
      date: todayDate,
      event: 'starlight_cta_clicked',
      metadata: {
        cardState,
        ctaType: 'starocean',
        gameType: todayGame.id,
      },
    });
    navigateToStarOcean();
  };

  const handleChestClick = () => {
    if (!progress?.pendingChest) {
      return;
    }

    const status = getChestStatus();

    if (status.status === 'locked') {
      alert(`宝箱解锁倒计时：${countdown}`);
      return;
    }

    if (status.status === 'expired') {
      alert('这个宝箱已过期，完成今日挑战可获得新的宝箱。');
      const updated = { ...progress, pendingChest: null };
      saveProgress(updated);
      refreshProgress();
      return;
    }

    if (status.status === 'unlocked') {
      const chest = claimChest();
      if (!chest) {
        return;
      }
      const infos = chest.levels.map((level) => getChestLevelInfo(level));
      const title = chest.levels.length > 1
        ? `已领取：${infos.map((item) => item.emoji).join(' + ')}`
        : `已领取：${infos[0].emoji} ${infos[0].name}`;
      alert(title);
      refreshProgress();
    }
  };

  const handleChestTooltip = (index: number, e: any) => {
    e.stopPropagation();
    setTooltipVisible(tooltipVisible === index ? null : index);
  };

  const handleReset = () => {
    const confirmed = confirm('确认清空本地数据吗？');
    if (!confirmed) {
      return;
    }
    Taro.clearStorageSync();
    refreshProgress();
    alert('本地数据已清空。');
  };

  const handleTestWin = () => {
    Taro.navigateTo({
      url: `/pages/game/index?mode=normal&autowin=true&gameType=${todayGame.id}`,
    });
  };

  const handleShowStatus = () => {
    alert(
      `今日日期：${todayDate}\n` +
      `今日游戏：${todayGame.id}\n` +
      `今日是否通关：${progress?.todayCompleted ? '是' : '否'}\n` +
      `英雄模式是否通关：${progress?.heroCompleted ? '是' : '否'}\n` +
      `连续天数：${progress?.consecutiveDays ?? 0}\n` +
      `待领取宝箱：${progress?.pendingChest ? progress.pendingChest.levels.join(', ') : '无'}`
    );
  };

  const handleNextDay = () => {
    const confirmed = confirm('确认切换到下一天调试吗？');
    if (!confirmed) {
      return;
    }
    advanceDebugDateByDays(1);
    refreshProgress();
    alert(`已切换到下一天：${getTodayDateString()}`);
  };

  const handleSkipCountdown = () => {
    if (!progress?.pendingChest) {
      alert('当前没有待领取宝箱。');
      return;
    }
    const now = new Date();
    const updated: GameProgress = {
      ...progress,
      pendingChest: {
        ...progress.pendingChest,
        unlockAt: new Date(now.getTime() - 1000).toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
    saveProgress(updated);
    refreshProgress();
    alert('已跳过宝箱倒计时。');
  };

  const renderTooltip = (level: ChestLevel) => {
    const rewards = getChestRewardDetails(level)[0];
    const info = getChestLevelInfo(level);
    return (
      <View className="chest-tooltip" onClick={(e) => e.stopPropagation()}>
        <Text className="tooltip-title">{info.emoji} {info.name}:</Text>
        <View className="tooltip-rewards">
          <Text className="tooltip-item">金币：{rewards.coins}</Text>
          <Text className="tooltip-item">道具：{rewards.props}</Text>
          {rewards.lottery && <Text className="tooltip-item">抽奖券：{rewards.lottery}</Text>}
          {rewards.physical && <Text className="tooltip-item">实物：{rewards.physical}</Text>}
        </View>
      </View>
    );
  };

  if (!progress) {
    return null;
  }

  const chestInfos = chestStatus.chest ? chestStatus.chest.levels.map((level) => getChestLevelInfo(level)) : null;
  const chestLevels = chestStatus.chest ? chestStatus.chest.levels : [];
  const cardDisplay = getCardDisplayContext(
    cardState,
    todayGame.meta.energyReward,
    progress.todayChestLevel || undefined
  );

  return (
    <View className={`starlight starlight--${cardState}`}>
      <View className="starlight__header">
        <View className="streak-badge">
          <Text className="streak-badge__icon">🔥</Text>
          <Text className="streak-badge__count">{progress.consecutiveDays}</Text>
        </View>
        {isDebugUiEnabled && (
          <View className="debug-buttons">
            <View className="debug-btn" onClick={handleReset}>
              <Text className="debug-btn__icon">🔄</Text>
              <Text className="debug-btn__label">清空数据</Text>
            </View>
            <View className="debug-btn" onClick={handleTestWin}>
              <Text className="debug-btn__icon">🎯</Text>
              <Text className="debug-btn__label">秒通调试</Text>
            </View>
            <View className="debug-btn" onClick={handleSkipCountdown}>
              <Text className="debug-btn__icon">⏭️</Text>
              <Text className="debug-btn__label">跳过倒计时</Text>
            </View>
            <View className="debug-btn" onClick={handleNextDay}>
              <Text className="debug-btn__icon">📅</Text>
              <Text className="debug-btn__label">切到明天</Text>
            </View>
            <View className="debug-btn" onClick={handleShowStatus}>
              <Text className="debug-btn__icon">📊</Text>
              <Text className="debug-btn__label">状态快照</Text>
            </View>
          </View>
        )}
      </View>

      <View className="starlight__planet">
        <PlanetView progress={planetProgress} size="large" onClick={handlePlanetClick} />
        <Text className="explore-hint">点击星球可进入探索</Text>
      </View>

      <View className="starlight__chest">
        {chestStatus.status === 'none' && (
          <View className="chest-empty">
            <Text className="empty-title">暂无宝箱</Text>
            <Text className="empty-text">完成今日挑战后，将获得下一阶段奖励宝箱。</Text>
          </View>
        )}

        {chestStatus.status === 'expired' && (
          <View className="chest-empty chest-empty--expired" onClick={handleChestClick}>
            <Text className="empty-title">宝箱已过期</Text>
            <Text className="empty-text">该宝箱的领取时间已结束。</Text>
          </View>
        )}

        {(chestStatus.status === 'locked' || chestStatus.status === 'unlocked') && chestInfos && (
          <View
            className={`chest-card ${chestStatus.status === 'locked' ? 'chest-card--locked' : 'chest-card--unlocked'}`}
            onClick={handleChestClick}
          >
            <Text className="chest-card__label">
              {chestStatus.status === 'locked' ? '补给宝箱运输中' : '星光宝箱已就绪'}
            </Text>
            <View className="chest-card__icons">
              {chestInfos.map((info, index) => (
                <View key={index} className="chest-icon-wrapper" onClick={(e) => handleChestTooltip(index, e)}>
                  <Text className="chest-icon">{info.emoji}</Text>
                  {tooltipVisible === index && renderTooltip(chestLevels[index])}
                </View>
              ))}
            </View>
            <Text className="chest-name">
              {chestInfos.length > 1 ? chestInfos.map((item) => item.name).join(' + ') : chestInfos[0].name}
            </Text>
            <Text className="expire-hint">
              {chestStatus.status === 'locked' ? `解锁倒计时 ${countdown}` : '点击领取奖励'}
            </Text>
            {chestStatus.status === 'unlocked' && <Button className="claim-btn" onClick={handleChestClick}>领取</Button>}
          </View>
        )}
      </View>

      <View className="starlight__mission">
        <TodayGameCard
          meta={todayGame.meta}
          cardState={cardState}
          display={cardDisplay}
          onStart={handleStart}
          onHero={handleHero}
          onExit={handleGoToStarOcean}
          feedbackSlot={null}
        />
      </View>

      <View className="starlight__milestones">
        <StreakMilestones
          currentDays={progress.consecutiveDays}
          milestones={[
            { days: 7, label: '7天奖励' },
            { days: 14, label: '14天贴纸' },
            { days: 30, label: '30天挂件' },
            { days: 60, label: '60天礼盒' },
          ]}
        />
      </View>
    </View>
  );
};

export default Starlight;
