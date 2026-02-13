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
    narrativeName: '星潮同调',
    narrativeDesc: '',
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
    { id: 'undo', name: '回退', description: '将槽位最后一个图块退回棋盘。', freeUses: 1 },
    { id: 'pop', name: '抽离', description: '把槽位前面的图块临时移出。', freeUses: 1 },
    { id: 'shuffle', name: '洗牌', description: '重新打乱棋盘图块位置。', freeUses: 1 },
  ],
  useTool: useThreeTilesTool,
  getHeroConfig: () => threeTilesHeroConfig,
  GameComponent: getThreeTilesGameComponent(),
};

export default threeTilesPlugin;
