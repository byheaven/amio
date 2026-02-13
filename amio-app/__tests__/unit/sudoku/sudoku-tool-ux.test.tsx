import React from 'react';
import { render } from '@tarojs/test-utils-react/dist/pure';
import sudokuPlugin from '@/games/sudoku';

const cloneGrid = (grid: Array<Array<string | null>>): Array<Array<string | null>> => {
  return grid.map((row) => [...row]);
};

describe('sudoku/tool-ux', () => {
  test('selector is disabled with reason when no editable cell is selected', () => {
    const state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 41 });

    const tree = render(
      <sudokuPlugin.GameComponent
        state={state}
        onAction={() => {
          return;
        }}
        onUseTool={() => {
          return;
        }}
        mode="normal"
      />,
      {}
    );

    expect(tree.container.textContent).toContain('请先选择可填写的格子。');
    expect(tree.container.querySelector('.icon-selector--disabled')).not.toBeNull();
  });

  test('check remains unavailable and does not mutate board', () => {
    const state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 42 });
    const before = cloneGrid(state.grid);

    const next = sudokuPlugin.useTool(state, 'check');

    expect(next.grid).toEqual(before);
    expect(next.lastUnavailableAction).toBe('check');
    expect(next.uiMessage).toBe('MVP 阶段暂不开放校验功能。');
  });

  test('hint consumes exactly one use and then becomes unavailable', () => {
    let state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 43 });

    state = sudokuPlugin.useTool(state, 'hint');
    expect(state.hintUsed).toBe(1);
    expect(state.uiMessage).toBe('已自动填写一个格子。');

    const second = sudokuPlugin.useTool(state, 'hint');
    expect(second.hintUsed).toBe(1);
    expect(second.lastUnavailableAction).toBe('hint');
    expect(second.uiMessage).toBe('提示次数已用完。');
  });
});
