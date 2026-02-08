import React from 'react';
import { View, Text } from '@tarojs/components';
import { getPlanetStage } from '../../utils/energyLogic';
import './index.scss';

export interface PlanetViewProps {
  progress: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

const PlanetView: React.FC<PlanetViewProps> = ({
  progress,
  size = 'medium',
  showLabel = true,
  animated = true,
  onClick,
}) => {
  const stage = getPlanetStage(progress);

  const sizeClass = `planet--${size}`;
  const stageClass = `planet--${stage}`;
  const animateClass = animated ? 'planet--animated' : '';

  return (
    <View
      className={`planet-container ${sizeClass}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <View className={`planet ${stageClass} ${animateClass}`}>
        <View className="planet__surface">
          {stage === 'desolate' && <View className="planet__cracks" />}
          {(stage === 'sprout' || stage === 'construction') && (
            <View className="planet__vegetation" />
          )}
          {(stage === 'prosperity' || stage === 'launch' || stage === 'landing') && (
            <View className="planet__cities" />
          )}
          {(stage === 'launch' || stage === 'landing') && (
            <View className="planet__ring" />
          )}
        </View>
        <View className="planet__glow" />
        {animated && (
          <>
            <View className="planet__pulse" />
            <View className="planet__ai-bots">
              <View className="ai-bot ai-bot--1" />
              <View className="ai-bot ai-bot--2" />
              <View className="ai-bot ai-bot--3" />
            </View>
          </>
        )}
      </View>
      {showLabel && (
        <View className="planet-label">
          <Text className="planet-label__name">鲨之星</Text>
          <Text className="planet-label__stage">· 已苏醒 {progress.toFixed(1)}%</Text>
        </View>
      )}
    </View>
  );
};

export default PlanetView;
