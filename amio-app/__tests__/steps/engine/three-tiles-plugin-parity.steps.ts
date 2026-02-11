import { defineFeature, loadFeature } from 'jest-cucumber';
import { TileType } from '@/constants/game';
import threeTilesPlugin from '@/games/3tiles';
import { ThreeTilesState } from '@/games/3tiles/logic';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/engine/three-tiles-plugin-parity.feature');

defineFeature(feature, (test) => {
  test('Normal clear path keeps parity', ({ given, when, then }) => {
    let state: ThreeTilesState;

    given('a 3tiles plugin state close to clear', () => {
      state = threeTilesPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 1 });
      state = {
        ...state,
        boardTiles: [
          { id: 'final', type: TileType.STAR, layer: 0, x: 0, y: 0, isClickable: true },
        ],
        slotTiles: [
          { id: 's1', type: TileType.STAR, layer: 0, x: 0, y: 0, isClickable: true },
          { id: 's2', type: TileType.STAR, layer: 0, x: 0, y: 0, isClickable: true },
        ],
        tempStacks: [[], [], []],
      };
    });

    when('I click the final matching tile', () => {
      state = threeTilesPlugin.handleAction(state, { type: 'tile_click', payload: { tileId: 'final' } });
    });

    then('the game status should be cleared', () => {
      expect(threeTilesPlugin.getStatus(state)).toBe('cleared');
    });
  });

  test('Hero retry and tools usage constraints', ({ given, when, then }) => {
    let state: ThreeTilesState;

    given('a 3tiles hero state', () => {
      state = threeTilesPlugin.initGame({ mode: 'hero', date: '2026-02-11', seed: 1 });
      state = {
        ...state,
        slotTiles: [{ id: 'x', type: TileType.STAR, layer: 0, x: 0, y: 0, isClickable: true }],
      };
    });

    when('I use undo twice and retry once', () => {
      state = threeTilesPlugin.useTool(state, 'undo');
      state = threeTilesPlugin.useTool(state, 'undo');
      state = threeTilesPlugin.handleAction(state, { type: 'retry' });
    });

    then('tool usage should only count once and attempts should increment', () => {
      expect(state.toolsUsed).toBe(0);
      expect(state.attempts).toBe(2);
    });
  });

  test('Loss on max slots remains unchanged', ({ given, when, then }) => {
    let state: ThreeTilesState;

    given('a 3tiles state with six slot tiles', () => {
      state = threeTilesPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 1 });
      state = {
        ...state,
        boardTiles: [
          { id: 't1', type: TileType.STAR, layer: 0, x: 0, y: 0, isClickable: true },
        ],
        slotTiles: [
          { id: '1', type: TileType.BAMBOO, layer: 0, x: 0, y: 0, isClickable: true },
          { id: '2', type: TileType.DOT, layer: 0, x: 0, y: 0, isClickable: true },
          { id: '3', type: TileType.CHARACTER, layer: 0, x: 0, y: 0, isClickable: true },
          { id: '4', type: TileType.HEART, layer: 0, x: 0, y: 0, isClickable: true },
          { id: '5', type: TileType.MEDAL, layer: 0, x: 0, y: 0, isClickable: true },
          { id: '6', type: TileType.RACKET, layer: 0, x: 0, y: 0, isClickable: true },
        ],
      };
    });

    when('I click a non-matching tile', () => {
      state = threeTilesPlugin.handleAction(state, { type: 'tile_click', payload: { tileId: 't1' } });
    });

    then('the game status should be failed', () => {
      expect(threeTilesPlugin.getStatus(state)).toBe('failed');
    });
  });
});
