import React from 'react';
import { View, Text } from '@tarojs/components';
import { GameMeta } from '@/types/game-plugin';
import './index.scss';

export type TodayCardState = 'idle' | 'playing' | 'completed' | 'hero' | 'done';

export interface TodayGameCardDisplayContext {
  badgeText: string;
  energyLabel: string;
  chestStatLabel?: string;
  journeyHint: string;
  startActionLabel: string;
  heroActionLabel: string;
  doneActionLabel: string;
  closeActionLabel: string;
}

interface TodayGameCardProps {
  meta: GameMeta;
  cardState: TodayCardState;
  display?: TodayGameCardDisplayContext;
  chestLabel?: string;
  onStart: () => void;
  onHero: () => void;
  onExit: () => void;
  feedbackSlot?: React.ReactNode;
}

const TodayGameCard: React.FC<TodayGameCardProps> = ({
  meta,
  cardState,
  display,
  chestLabel,
  onStart,
  onHero,
  onExit,
  feedbackSlot,
}) => {
  const Thumbnail = meta.thumbnailComponent;
  const modifierClass = `is-${cardState}`;

  const resolvedDisplay: TodayGameCardDisplayContext = display || {
    badgeText: '今日任务',
    energyLabel: `+${meta.energyReward} 星能`,
    chestStatLabel: chestLabel ? `宝箱 ${chestLabel}` : undefined,
    journeyHint: '今天来一局，星球就会更亮一点。',
    startActionLabel: '开始挑战',
    heroActionLabel: '挑战英雄模式',
    doneActionLabel: '去星海看看',
    closeActionLabel: '去星海看看',
  };

  return (
    <View className={`today-game-card ${modifierClass}`}>
      <View className="today-game-card__header">
        <Text className="today-game-card__badge">{resolvedDisplay.badgeText}</Text>
        <Text className="today-game-card__energy">{resolvedDisplay.energyLabel}</Text>
      </View>

      <View className="today-game-card__hero">
        <View className="today-game-card__thumb">
          <Thumbnail />
        </View>
      </View>

      {resolvedDisplay.chestStatLabel && (
        <View className="today-game-card__stats">
          <Text className="today-game-card__stat">{resolvedDisplay.chestStatLabel}</Text>
        </View>
      )}

      <Text className="today-game-card__hint">{resolvedDisplay.journeyHint}</Text>

      {feedbackSlot && <View className="today-game-card__feedback">{feedbackSlot}</View>}

      <View className="today-game-card__actions">
        {(cardState === 'idle' || cardState === 'playing') && (
          <View className="today-game-card__button" onClick={onStart}>
            <Text>{resolvedDisplay.startActionLabel}</Text>
          </View>
        )}

        {cardState === 'completed' && (
          <>
            <View className="today-game-card__button" onClick={onHero}>
              <Text>{resolvedDisplay.heroActionLabel}</Text>
            </View>
            <View className="today-game-card__button today-game-card__button--secondary" onClick={onExit}>
              <Text>{resolvedDisplay.doneActionLabel}</Text>
            </View>
          </>
        )}

        {(cardState === 'hero' || cardState === 'done') && (
          <View className="today-game-card__button today-game-card__button--secondary" onClick={onExit}>
            <Text>{resolvedDisplay.closeActionLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TodayGameCard;
