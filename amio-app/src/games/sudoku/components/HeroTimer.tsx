import React from 'react';
import { View, Text } from '@tarojs/components';

interface HeroTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
}

const HeroTimer: React.FC<HeroTimerProps> = ({ remainingSeconds, totalSeconds }) => {
  const ratio = Math.max(0, Math.min(1, remainingSeconds / totalSeconds));
  const danger = remainingSeconds <= 30;

  return (
    <View className={`hero-timer${danger ? ' hero-timer--danger' : ''}`} data-danger={danger ? 'true' : 'false'}>
      <View className="hero-timer__bar" style={{ width: `${ratio * 100}%` }} />
      <Text className="hero-timer__text">{remainingSeconds}s</Text>
    </View>
  );
};

export default HeroTimer;
