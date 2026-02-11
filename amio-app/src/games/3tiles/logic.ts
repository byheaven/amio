import { ChestLevel, TileData } from '@/constants/game';
import { GameAction, GameConfig, GameState, PerformanceMetrics } from '@/engine/types';
import { assignRandomTileTypes, generateDailyLayout, getDailyLayoutSeed } from '@/utils/dailyLevel';
import { checkMatch, updateClickableStatus } from '@/utils/gameLogic';
import { generateHeroLevel } from '@/utils/heroLevel';
import {
  popTilesToTemp,
  returnTileFromTempStack,
  shuffleBoard,
  TempSlotStacks,
  undoLastTile,
} from '@/utils/toolsLogic';
import { calculateChestLevel, createInitialStats } from '@/utils/chestLogic';

export interface ThreeTilesState extends GameState {
  gameId: '3tiles';
  mode: 'normal' | 'hero';
  boardTiles: TileData[];
  slotTiles: TileData[];
  tempStacks: TempSlotStacks;
  undoUsed: boolean;
  shuffleUsed: boolean;
  popUsed: boolean;
  dailySeed: number;
  dailyLayout: Array<{ x: number; y: number; layer: number }>;
}

const createNormalTiles = (seed: number): { layout: Array<{ x: number; y: number; layer: number }>; tiles: TileData[] } => {
  const layout = generateDailyLayout(seed, 75);
  const tiles = assignRandomTileTypes(layout);
  return { layout, tiles };
};

export const initThreeTilesState = (config: GameConfig): ThreeTilesState => {
  const now = Date.now();
  const seed = config.seed ?? getDailyLayoutSeed();

  if (config.mode === 'hero') {
    return {
      gameId: '3tiles',
      mode: 'hero',
      status: 'playing',
      startedAt: now,
      attempts: 1,
      toolsUsed: 0,
      boardTiles: generateHeroLevel(seed),
      slotTiles: [],
      tempStacks: [[], [], []],
      undoUsed: false,
      shuffleUsed: false,
      popUsed: false,
      dailySeed: seed,
      dailyLayout: [],
    };
  }

  const { layout, tiles } = createNormalTiles(seed);
  return {
    gameId: '3tiles',
    mode: 'normal',
    status: 'playing',
    startedAt: now,
    attempts: 1,
    toolsUsed: 0,
    boardTiles: tiles,
    slotTiles: [],
    tempStacks: [[], [], []],
    undoUsed: false,
    shuffleUsed: false,
    popUsed: false,
    dailySeed: seed,
    dailyLayout: layout,
  };
};

const isCleared = (state: ThreeTilesState): boolean => {
  const tempTilesCount = state.tempStacks.reduce((sum, stack) => sum + stack.length, 0);
  return state.boardTiles.length === 0 && state.slotTiles.length === 0 && tempTilesCount === 0;
};

const applyWinOrLossState = (state: ThreeTilesState): ThreeTilesState => {
  if (isCleared(state)) {
    return {
      ...state,
      status: 'cleared',
      endedAt: Date.now(),
    };
  }

  if (state.slotTiles.length >= 7) {
    return {
      ...state,
      status: 'failed',
      endedAt: Date.now(),
    };
  }

  return state;
};

const findTileById = (tiles: TileData[], tileId: string): TileData | undefined => {
  return tiles.find((tile) => tile.id === tileId);
};

const handleTileClick = (state: ThreeTilesState, tileId: string): ThreeTilesState => {
  if (state.status !== 'playing') {
    return state;
  }

  const tile = findTileById(state.boardTiles, tileId);
  if (!tile || !tile.isClickable) {
    return state;
  }

  const newBoardTiles = updateClickableStatus(state.boardTiles.filter((item) => item.id !== tileId));
  const { newSlots, matched } = checkMatch([...state.slotTiles, tile]);

  const newState: ThreeTilesState = {
    ...state,
    boardTiles: newBoardTiles,
    slotTiles: matched ? newSlots : newSlots,
  };

  return applyWinOrLossState(newState);
};

const handleRetry = (state: ThreeTilesState): ThreeTilesState => {
  if (state.mode === 'hero') {
    return {
      ...state,
      status: 'playing',
      attempts: state.attempts + 1,
      toolsUsed: 0,
      undoUsed: false,
      shuffleUsed: false,
      popUsed: false,
      endedAt: undefined,
      boardTiles: generateHeroLevel(state.dailySeed),
      slotTiles: [],
      tempStacks: [[], [], []],
    };
  }

  const refreshedTiles = assignRandomTileTypes(state.dailyLayout);
  return {
    ...state,
    status: 'playing',
    attempts: state.attempts + 1,
    toolsUsed: 0,
    undoUsed: false,
    shuffleUsed: false,
    popUsed: false,
    endedAt: undefined,
    boardTiles: refreshedTiles,
    slotTiles: [],
    tempStacks: [[], [], []],
  };
};

const handleReturnFromTemp = (state: ThreeTilesState, positionIndex: number): ThreeTilesState => {
  const { newSlot, newTempStacks, success } = returnTileFromTempStack(positionIndex, state.slotTiles, state.tempStacks, 7);
  if (!success) {
    return state;
  }

  const { newSlots } = checkMatch(newSlot);
  return applyWinOrLossState({
    ...state,
    slotTiles: newSlots,
    tempStacks: newTempStacks,
  });
};

export const handleThreeTilesAction = (state: ThreeTilesState, action: GameAction): ThreeTilesState => {
  switch (action.type) {
    case 'tile_click': {
      const tileId = action.payload?.tileId;
      if (typeof tileId !== 'string') {
        return state;
      }
      return handleTileClick(state, tileId);
    }
    case 'retry':
      return handleRetry(state);
    case 'return_temp': {
      const index = action.payload?.positionIndex;
      if (typeof index !== 'number') {
        return state;
      }
      return handleReturnFromTemp(state, index);
    }
    case 'quit':
      return {
        ...state,
        status: 'quit',
        endedAt: Date.now(),
      };
    default:
      return state;
  }
};

const addToolUsage = (state: ThreeTilesState): ThreeTilesState => ({
  ...state,
  toolsUsed: state.toolsUsed + 1,
});

export const useThreeTilesTool = (state: ThreeTilesState, toolId: string): ThreeTilesState => {
  if (state.status !== 'playing') {
    return state;
  }

  if (toolId === 'undo') {
    if (state.undoUsed) {
      return state;
    }
    const { newBoard, newSlot, success } = undoLastTile(state.boardTiles, state.slotTiles);
    if (!success) {
      return state;
    }
    return addToolUsage({
      ...state,
      boardTiles: newBoard,
      slotTiles: newSlot,
      undoUsed: true,
    });
  }

  if (toolId === 'shuffle') {
    if (state.shuffleUsed) {
      return state;
    }
    return addToolUsage({
      ...state,
      boardTiles: shuffleBoard(state.boardTiles),
      shuffleUsed: true,
    });
  }

  if (toolId === 'pop') {
    if (state.popUsed) {
      return state;
    }
    const { remainSlot, newTempStacks, success } = popTilesToTemp(state.slotTiles, state.tempStacks);
    if (!success) {
      return state;
    }
    return addToolUsage({
      ...state,
      slotTiles: remainSlot,
      tempStacks: newTempStacks,
      popUsed: true,
    });
  }

  return state;
};

const mapChestToScore = (level: ChestLevel): number => {
  switch (level) {
    case ChestLevel.DIAMOND:
      return 100;
    case ChestLevel.GOLD:
      return 80;
    case ChestLevel.SILVER:
      return 60;
    default:
      return 30;
  }
};

export const getThreeTilesPerformance = (state: ThreeTilesState): PerformanceMetrics => {
  const stats = createInitialStats();
  stats.attempts = state.attempts;
  stats.toolsUsed = state.toolsUsed;
  const chestLevel = calculateChestLevel(stats);

  return {
    efficiencyScore: mapChestToScore(chestLevel),
    toolsUsed: state.toolsUsed,
    rawData: {
      attempts: state.attempts,
      mode: state.mode,
      status: state.status,
      chestLevel,
    },
  };
};

export const getThreeTilesStatus = (state: ThreeTilesState): ThreeTilesState['status'] => state.status;
