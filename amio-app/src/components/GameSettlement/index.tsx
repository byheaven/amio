import React from 'react';
import { View, Text } from '@tarojs/components';
import { FeedbackValue, GameResult } from '@/engine/types';
import { GameMeta } from '@/types/game-plugin';
import PreferenceFeedback from '@/components/PreferenceFeedback';
import './index.scss';

interface GameSettlementProps {
  gameMeta: GameMeta;
  result: GameResult;
  chestLevel: 'diamond' | 'gold' | 'silver' | 'bronze';
  heroAvailable: boolean;
  feedback: FeedbackValue;
  onFeedbackChange: (value: FeedbackValue) => void;
  onHeroChallenge: () => void;
  onDone: () => void;
}

const GameSettlement: React.FC<GameSettlementProps> = ({
  gameMeta,
  result,
  chestLevel,
  heroAvailable,
  feedback,
  onFeedbackChange,
  onHeroChallenge,
  onDone,
}) => {
  const chestLabelMap: Record<'diamond' | 'gold' | 'silver' | 'bronze', string> = {
    diamond: '钻石',
    gold: '黄金',
    silver: '白银',
    bronze: '青铜',
  };

  return (
    <View className="game-settlement">
      <Text className="game-settlement__title">{result.status === 'cleared' ? '通关结算' : '对局结算'}</Text>
      <Text className="game-settlement__name">{gameMeta.narrativeName}</Text>
      <Text className="game-settlement__line">⚡ 星能 +{gameMeta.energyReward}</Text>
      <Text className="game-settlement__line">📦 宝箱：{chestLabelMap[chestLevel]}</Text>

      <PreferenceFeedback value={feedback} onChange={onFeedbackChange} />

      {heroAvailable && (
        <View className="game-settlement__button" onClick={onHeroChallenge}>
          <Text>挑战英雄模式</Text>
        </View>
      )}

      <View className="game-settlement__link" onClick={onDone}>
        <Text>今天先到这里</Text>
      </View>
    </View>
  );
};

export default GameSettlement;
