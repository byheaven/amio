import { TileType } from '@/constants/game';
import threeTilesPlugin from '@/games/3tiles';
import { ThreeTilesState } from '@/games/3tiles/logic';

describe('games/3tiles logic', () => {
  test('reaches failed state when slot grows to 7 without match', () => {
    let state: ThreeTilesState = threeTilesPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 1 });
    state = {
      ...state,
      boardTiles: [{ id: 't1', type: TileType.STAR, layer: 0, x: 0, y: 0, isClickable: true }],
      slotTiles: [
        { id: '1', type: TileType.BAMBOO, layer: 0, x: 0, y: 0, isClickable: true },
        { id: '2', type: TileType.DOT, layer: 0, x: 0, y: 0, isClickable: true },
        { id: '3', type: TileType.CHARACTER, layer: 0, x: 0, y: 0, isClickable: true },
        { id: '4', type: TileType.HEART, layer: 0, x: 0, y: 0, isClickable: true },
        { id: '5', type: TileType.MEDAL, layer: 0, x: 0, y: 0, isClickable: true },
        { id: '6', type: TileType.RACKET, layer: 0, x: 0, y: 0, isClickable: true },
      ],
    };

    state = threeTilesPlugin.handleAction(state, { type: 'tile_click', payload: { tileId: 't1' } });

    expect(state.status).toBe('failed');
  });

  test('retry increments attempts', () => {
    let state: ThreeTilesState = threeTilesPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 1 });
    state = threeTilesPlugin.handleAction(state, { type: 'retry' });

    expect(state.attempts).toBe(2);
    expect(state.status).toBe('playing');
  });
});
