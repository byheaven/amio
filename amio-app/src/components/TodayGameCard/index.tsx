import React from 'react';
import { View, Text } from '@tarojs/components';
import { GameMeta } from '@/types/game-plugin';
import './index.scss';

export type TodayCardState = 'idle' | 'playing' | 'completed' | 'hero' | 'done';

interface TodayGameCardProps {
  meta: GameMeta;
  cardState: TodayCardState;
  bestLabel: string;
  chestLabel?: string;
  onStart: () => void;
  onHero: () => void;
  onExit: () => void;
  feedbackSlot?: React.ReactNode;
}

const TodayGameCard: React.FC<TodayGameCardProps> = ({
  meta,
  cardState,
  bestLabel,
  chestLabel,
  onStart,
  onHero,
  onExit,
  feedbackSlot,
}) => {
  const Thumbnail = meta.thumbnailComponent;

  return (
    <View className="today-game-card">
      <Text className="today-game-card__title">{cardState === 'completed' || cardState === 'done' ? '✅ Today Completed' : '✨ Today Game'}</Text>
      <Text className="today-game-card__name">{meta.narrativeName}</Text>
      <Text className="today-game-card__desc">{meta.narrativeDesc}</Text>
      <View className="today-game-card__thumb">
        <Thumbnail />
      </View>
      <Text className="today-game-card__meta">⚡ +{meta.energyReward} · 🏆 {bestLabel}</Text>
      {chestLabel && <Text className="today-game-card__chest">📦 {chestLabel}</Text>}
      {feedbackSlot}

      {(cardState === 'idle' || cardState === 'playing') && (
        <View className="today-game-card__button" onClick={onStart}>
          <Text>Start</Text>
        </View>
      )}

      {cardState === 'completed' && (
        <>
          <View className="today-game-card__button" onClick={onHero}>
            <Text>Challenge Hero</Text>
          </View>
          <View className="today-game-card__link" onClick={onExit}>
            <Text>Done for today</Text>
          </View>
        </>
      )}

      {(cardState === 'hero' || cardState === 'done') && (
        <View className="today-game-card__link" onClick={onExit}>
          <Text>Close</Text>
        </View>
      )}
    </View>
  );
};

export default TodayGameCard;
