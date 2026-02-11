import React from 'react';
import { GamePlugin } from '@/types/game-plugin';
import { GameConfig, GameState } from '@/engine/types';

interface MockState extends GameState {
  gameId: string;
  counter: number;
}

const MockGameComponent: React.FC = () => null;

export const createMockPlugin = (id: string = 'mock'): GamePlugin<MockState> => {
  return {
    id,
    meta: {
      id,
      narrativeName: `Mock-${id}`,
      narrativeDesc: 'Mock plugin for tests',
      icon: '🧪',
      thumbnailComponent: MockGameComponent,
      energyReward: 10,
    },
    ratingConfig: {
      diamond: { minEfficiencyScore: 90, maxToolsUsed: 0 },
      gold: { minEfficiencyScore: 70, maxToolsUsed: 1 },
      silver: { minEfficiencyScore: 40, maxToolsUsed: 2 },
    },
    initGame: (_config: GameConfig) => ({
      gameId: id,
      status: 'playing',
      startedAt: Date.now(),
      attempts: 1,
      toolsUsed: 0,
      counter: 0,
    }),
    handleAction: (state, action) => {
      if (action.type === 'win') {
        return { ...state, status: 'cleared', endedAt: Date.now(), counter: state.counter + 1 };
      }
      if (action.type === 'fail') {
        return { ...state, status: 'failed', endedAt: Date.now(), counter: state.counter + 1 };
      }
      return { ...state, counter: state.counter + 1 };
    },
    getStatus: (state) => state.status,
    getPerformance: (state) => ({
      efficiencyScore: state.status === 'cleared' ? 95 : 30,
      toolsUsed: state.toolsUsed,
      rawData: { counter: state.counter },
    }),
    getTools: () => [{ id: 'noop', name: 'Noop', description: 'Noop', freeUses: 1 }],
    useTool: (state) => ({ ...state, toolsUsed: state.toolsUsed + 1 }),
    getHeroConfig: () => ({ enabled: true, mode: 'hero', description: 'Mock hero' }),
    GameComponent: MockGameComponent,
  };
};
