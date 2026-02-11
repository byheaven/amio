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
  return (
    <View className="game-settlement">
      <Text className="game-settlement__title">{result.status === 'cleared' ? 'Completed' : 'Result'}</Text>
      <Text className="game-settlement__name">{gameMeta.narrativeName}</Text>
      <Text className="game-settlement__line">⚡ +{gameMeta.energyReward}</Text>
      <Text className="game-settlement__line">📦 {chestLevel}</Text>

      <PreferenceFeedback value={feedback} onChange={onFeedbackChange} />

      {heroAvailable && (
        <View className="game-settlement__button" onClick={onHeroChallenge}>
          <Text>Challenge Hero</Text>
        </View>
      )}

      <View className="game-settlement__link" onClick={onDone}>
        <Text>Done for today</Text>
      </View>
    </View>
  );
};

export default GameSettlement;
