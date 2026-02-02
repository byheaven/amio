import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import PlanetView from '../../components/PlanetView';
import { loadProgress } from '../../utils/storage';
import { syncPlanetProgress } from '../../utils/energyLogic';
import type { GameProgress } from '../../utils/storage';
import './index.scss';

const Starlight: React.FC = () => {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [planetProgress, setPlanetProgress] = useState(67.3);

  useEffect(() => {
    const loaded = loadProgress();
    setProgress(loaded);

    // Sync planet progress from server
    syncPlanetProgress().then(data => {
      setPlanetProgress(data.progress);
    });
  }, []);

  const handleLightUp = () => {
    if (progress?.todayCompleted) {
      // Go to hero mode
      Taro.navigateTo({ url: '/pages/game/index?mode=hero' });
    } else {
      // Go to normal game
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

  if (!progress) return null;

  return (
    <View className="starlight">
      {/* Top Status */}
      <View className="starlight__header">
        <View className="streak-badge">
          <Text className="streak-badge__icon">🔥</Text>
          <Text className="streak-badge__count">{progress.consecutiveDays}</Text>
        </View>
        <Text className="settings-icon">⚙️</Text>
      </View>

      {/* Planet Visualization */}
      <View className="starlight__planet">
        <PlanetView progress={planetProgress} size="large" />
      </View>

      {/* Chest Area */}
      <View className="starlight__chest">
        {progress.pendingChest ? (
          <View className="chest-card">
            <Text className="chest-card__label">✨ 来自星球的回馈</Text>
            <View className="chest-card__content">
              <Text className="chest-icon">🥇</Text>
              <Text className="chest-text">{progress.pendingChest.levels[0]}宝箱</Text>
            </View>
          </View>
        ) : (
          <Text className="encouragement">星球记得你的每一份光</Text>
        )}
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
