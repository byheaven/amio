import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import PlanetView from '@/components/PlanetView';
import TodayGameCard, { TodayCardState } from '@/components/TodayGameCard';
import PreferenceFeedback from '@/components/PreferenceFeedback';
import StreakMilestones from '@/components/StreakMilestones';
import { GameEngine } from '@/engine/game-engine';
import { gameLogger } from '@/services/game-logger';
import { preferenceStore } from '@/services/preference-store';
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
import { FeedbackValue } from '@/engine/types';
import './index.scss';

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

const formatBestTime = (seconds: number | null): string => {
  if (!seconds || seconds <= 0) {
    return '--:--';
  }
  const minute = String(Math.floor(seconds / 60)).padStart(2, '0');
  const second = String(seconds % 60).padStart(2, '0');
  return `${minute}:${second}`;
};

const Starlight: React.FC = () => {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [planetProgress, setPlanetProgress] = useState(67.3);
  const [chestStatus, setChestStatus] = useState(getChestStatus());
  const [countdown, setCountdown] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState<number | null>(null);
  const [cardState, setCardState] = useState<TodayCardState>('idle');
  const [bestTimeLabel, setBestTimeLabel] = useState('--:--');
  const [feedback, setFeedback] = useState<FeedbackValue>('skipped');
  const [todayDate, setTodayDate] = useState(getTodayDateString());

  const engine = useMemo(() => {
    registerBuiltInGames();
    return new GameEngine();
  }, []);

  const todayGame = useMemo(() => {
    return engine.getTodayGame('local-user', todayDate);
  }, [engine, todayDate]);

  const refreshProgress = () => {
    const effectiveDate = getTodayDateString();
    const effectiveGame = engine.getTodayGame('local-user', effectiveDate);
    setTodayDate(effectiveDate);

    const loaded = loadProgress();
    setProgress(loaded);
    setChestStatus(getChestStatus());
    setCardState(deriveCardState(loaded));

    const logs = gameLogger
      .listByUser('local-user')
      .filter((item) => item.gameType === effectiveGame.id && item.result === 'cleared');
    const best = logs.reduce<number | null>((acc, item) => {
      if (acc === null || item.durationSeconds < acc) {
        return item.durationSeconds;
      }
      return acc;
    }, null);
    setBestTimeLabel(formatBestTime(best));

    const preferences = preferenceStore
      .listByUser('local-user')
      .filter((item) => item.date === effectiveDate && item.gameType === effectiveGame.id);
    const latest = preferences[preferences.length - 1];
    setFeedback(latest?.feedback || 'skipped');

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

  const handlePlanetClick = () => {
    Taro.navigateTo({ url: '/pages/world/index' });
  };

  const handleStart = () => {
    setCardState('playing');
    Taro.navigateTo({ url: `/pages/game/index?mode=normal&gameType=${todayGame.id}` });
  };

  const handleHero = () => {
    setCardState('hero');
    Taro.navigateTo({ url: `/pages/game/index?mode=hero&gameType=${todayGame.id}` });
  };

  const handleCardDone = () => {
    setCardState('done');
  };

  const handleFeedbackChange = (value: FeedbackValue) => {
    setFeedback(value);
    preferenceStore.save({
      userId: 'local-user',
      date: todayDate,
      gameType: todayGame.id,
      feedback: value,
    });
  };

  const handleChestClick = () => {
    if (!progress?.pendingChest) {
      return;
    }

    const status = getChestStatus();

    if (status.status === 'locked') {
      alert(`Chest unlock in: ${countdown}`);
      return;
    }

    if (status.status === 'expired') {
      alert('Chest expired. Come back tomorrow.');
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
        ? `Received ${infos.map((item) => item.emoji).join(' + ')}`
        : `Received ${infos[0].emoji} ${infos[0].name}`;
      alert(`${title}`);
      refreshProgress();
    }
  };

  const handleChestTooltip = (index: number, e: any) => {
    e.stopPropagation();
    setTooltipVisible(tooltipVisible === index ? null : index);
  };

  const handleReset = () => {
    const confirmed = confirm('Clear all local data?');
    if (!confirmed) {
      return;
    }
    Taro.clearStorageSync();
    refreshProgress();
    alert('Data reset completed.');
  };

  const handleTestWin = () => {
    Taro.navigateTo({
      url: `/pages/game/index?mode=normal&autowin=true&gameType=${todayGame.id}`,
    });
  };

  const handleShowStatus = () => {
    alert(
      `Today Date: ${todayDate}\n` +
      `Today Game: ${todayGame.id}\n` +
      `Today Completed: ${progress?.todayCompleted ? 'Yes' : 'No'}\n` +
      `Hero Completed: ${progress?.heroCompleted ? 'Yes' : 'No'}\n` +
      `Consecutive Days: ${progress?.consecutiveDays ?? 0}\n` +
      `Pending Chest: ${progress?.pendingChest ? progress.pendingChest.levels.join(', ') : 'None'}`
    );
  };

  const handleNextDay = () => {
    const confirmed = confirm('Move to next day simulation?');
    if (!confirmed) {
      return;
    }
    advanceDebugDateByDays(1);
    refreshProgress();
    alert(`Moved to next day: ${getTodayDateString()}`);
  };

  const handleSkipCountdown = () => {
    if (!progress?.pendingChest) {
      alert('No pending chest.');
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
    alert('Chest countdown skipped.');
  };

  const renderTooltip = (level: ChestLevel) => {
    const rewards = getChestRewardDetails(level)[0];
    const info = getChestLevelInfo(level);
    return (
      <View className="chest-tooltip" onClick={(e) => e.stopPropagation()}>
        <Text className="tooltip-title">{info.emoji} {info.name}:</Text>
        <View className="tooltip-rewards">
          <Text className="tooltip-item">💰 {rewards.coins}</Text>
          <Text className="tooltip-item">🧰 {rewards.props}</Text>
          {rewards.lottery && <Text className="tooltip-item">🎫 {rewards.lottery}</Text>}
          {rewards.physical && <Text className="tooltip-item">🎁 {rewards.physical}</Text>}
        </View>
      </View>
    );
  };

  if (!progress) {
    return null;
  }

  const chestInfos = chestStatus.chest ? chestStatus.chest.levels.map((level) => getChestLevelInfo(level)) : null;
  const chestLevels = chestStatus.chest ? chestStatus.chest.levels : [];
  const showFeedback = cardState === 'completed' || cardState === 'done';

  return (
    <View className="starlight">
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

      <View className="starlight__planet">
        <PlanetView progress={planetProgress} size="large" onClick={handlePlanetClick} />
        <Text className="explore-hint">Tap planet to explore</Text>
      </View>

      <TodayGameCard
        meta={todayGame.meta}
        cardState={cardState}
        bestLabel={bestTimeLabel}
        chestLabel={progress.todayChestLevel || undefined}
        onStart={handleStart}
        onHero={handleHero}
        onExit={handleCardDone}
        feedbackSlot={
          showFeedback ? (
            <PreferenceFeedback value={feedback} onChange={handleFeedbackChange} />
          ) : null
        }
      />

      <View className="starlight__chest">
        {chestStatus.status === 'none' && (
          <View className="chest-empty">
            <Text className="empty-text">No chest available today</Text>
          </View>
        )}

        {(chestStatus.status === 'locked' || chestStatus.status === 'unlocked') && chestInfos && (
          <View className={`chest-card ${chestStatus.status === 'locked' ? 'chest-locked' : 'chest-unlocked'}`} onClick={handleChestClick}>
            <Text className="chest-card__label">Star reward chest</Text>
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
            <Text className="expire-hint">⏰ {countdown}</Text>
            {chestStatus.status === 'unlocked' && <Button className="claim-btn" onClick={handleChestClick}>Claim</Button>}
          </View>
        )}
      </View>

      <View className="starlight__milestones">
        <StreakMilestones
          currentDays={progress.consecutiveDays}
          milestones={[
            { days: 7, label: '7d reward' },
            { days: 14, label: '14d sticker' },
            { days: 30, label: '30d charm' },
            { days: 60, label: '60d gift box' },
          ]}
        />
      </View>
    </View>
  );
};

export default Starlight;
