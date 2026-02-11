import { GamePlugin } from '@/types/game-plugin';
import { ThreeTilesState, getThreeTilesPerformance, getThreeTilesStatus, handleThreeTilesAction, initThreeTilesState, useThreeTilesTool } from '@/games/3tiles/logic';
import { tilesRatingConfig } from '@/games/3tiles/rating-config';
import { threeTilesHeroConfig } from '@/games/3tiles/hero';
import ThreeTilesThumbnail from '@/games/3tiles/thumbnail';
import { GameComponentProps } from '@/types/game-plugin';
import React from 'react';

const TestThreeTilesComponent: React.FC<GameComponentProps<ThreeTilesState>> = () => null;

const getThreeTilesGameComponent = (): React.ComponentType<GameComponentProps<ThreeTilesState>> => {
  if (process.env.NODE_ENV === 'test') {
    return TestThreeTilesComponent;
  }

  // Lazy-require to avoid SCSS parsing in jest while keeping the real game UI at runtime.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@/games/3tiles/components/ThreeTilesGameComponent').default;
};

const threeTilesPlugin: GamePlugin<ThreeTilesState> = {
  id: '3tiles',
  meta: {
    id: '3tiles',
    narrativeName: 'Three Tiles',
    narrativeDesc: 'Match three tiles and clear all stacks.',
    icon: '🀄️',
    thumbnailComponent: ThreeTilesThumbnail,
    energyReward: 120,
  },
  ratingConfig: tilesRatingConfig,
  initGame: initThreeTilesState,
  handleAction: handleThreeTilesAction,
  getStatus: getThreeTilesStatus,
  getPerformance: getThreeTilesPerformance,
  getTools: () => [
    { id: 'undo', name: 'Undo', description: 'Move last slot tile back to board.', freeUses: 1 },
    { id: 'pop', name: 'Pop', description: 'Move front slot tiles to temp stacks.', freeUses: 1 },
    { id: 'shuffle', name: 'Shuffle', description: 'Shuffle board positions.', freeUses: 1 },
  ],
  useTool: useThreeTilesTool,
  getHeroConfig: () => threeTilesHeroConfig,
  GameComponent: getThreeTilesGameComponent(),
};

export default threeTilesPlugin;
