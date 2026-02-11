import React from 'react';
import { View, Text } from '@tarojs/components';
import { GamePlugin } from '@/types/game-plugin';
import { GameConfig, GameState } from '@/engine/types';

interface MockState extends GameState {
  gameId: 'mock';
}

const MockComponent: React.FC = () => (
  <View>
    <Text>Mock Game</Text>
  </View>
);

const createState = (_config: GameConfig): MockState => ({
  gameId: 'mock',
  status: 'playing',
  startedAt: Date.now(),
  attempts: 1,
  toolsUsed: 0,
  endedAt: undefined,
});

const mockPlugin: GamePlugin<MockState> = {
  id: 'mock',
  meta: {
    id: 'mock',
    narrativeName: 'Mock Game',
    narrativeDesc: 'Smoke test plugin.',
    icon: '🧪',
    thumbnailComponent: MockComponent,
    energyReward: 1,
  },
  ratingConfig: {
    diamond: { minEfficiencyScore: 90, maxToolsUsed: 0 },
    gold: { minEfficiencyScore: 70, maxToolsUsed: 1 },
    silver: { minEfficiencyScore: 40, maxToolsUsed: 2 },
  },
  initGame: createState,
  handleAction: (state) => state,
  getStatus: (state) => state.status,
  getPerformance: () => ({
    efficiencyScore: 100,
    toolsUsed: 0,
    rawData: {},
  }),
  getTools: () => [],
  useTool: (state) => state,
  getHeroConfig: () => ({ enabled: false, mode: 'hero', description: 'Not supported.' }),
  GameComponent: MockComponent,
};

export default mockPlugin;
