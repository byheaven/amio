import { gameRegistry } from '@/engine/game-registry';
import threeTilesPlugin from '@/games/3tiles';
import sudokuPlugin from '@/games/sudoku';

let initialized = false;

export const registerBuiltInGames = (): void => {
  if (initialized) {
    return;
  }

  gameRegistry.register(threeTilesPlugin);
  gameRegistry.register(sudokuPlugin);
  initialized = true;
};
