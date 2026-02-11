import sudokuPlugin, { SudokuState } from '@/games/sudoku';

const findEditableCell = (state: SudokuState): { row: number; col: number } => {
  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      if (state.puzzle.givens[row][col] === null) {
        return { row, col };
      }
    }
  }
  throw new Error('Editable cell not found');
};

const findGivenCell = (state: SudokuState): { row: number; col: number } => {
  for (let row = 0; row < state.grid.length; row += 1) {
    for (let col = 0; col < state.grid[row].length; col += 1) {
      if (state.puzzle.givens[row][col] !== null) {
        return { row, col };
      }
    }
  }
  throw new Error('Given cell not found');
};

describe('sudoku/interaction-logic', () => {
  test('ignores out-of-range selection safely', () => {
    const state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 31 });
    const next = sudokuPlugin.handleAction(state, {
      type: 'select_cell',
      payload: { row: 99, col: 99 },
    });

    expect(next.selectedCell).toBeNull();
    expect(next.uiMessage).toBe('Invalid cell selection.');
  });

  test('given cell stays immutable with lock feedback', () => {
    let state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 32 });
    const given = findGivenCell(state);
    const before = state.grid[given.row][given.col];

    state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: given });
    state = sudokuPlugin.handleAction(state, {
      type: 'input_symbol',
      payload: { symbol: state.puzzle.symbols[0] },
    });

    expect(state.grid[given.row][given.col]).toBe(before);
    expect(state.uiMessage).toBe('This cell is fixed and cannot be changed.');
  });

  test('invalid symbol payload is ignored safely', () => {
    let state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 33 });
    const editable = findEditableCell(state);

    state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: editable });
    state = sudokuPlugin.handleAction(state, {
      type: 'input_symbol',
      payload: { symbol: 'invalid' },
    });

    expect(state.grid[editable.row][editable.col]).toBeNull();
    expect(state.uiMessage).toBe('Invalid symbol selection.');
  });

  test('fill with wrong values keeps playing and correcting all editable cells clears', () => {
    let state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 34 });
    const editableCells: Array<{ row: number; col: number }> = [];

    for (let row = 0; row < state.grid.length; row += 1) {
      for (let col = 0; col < state.grid[row].length; col += 1) {
        if (state.puzzle.givens[row][col] !== null) {
          continue;
        }
        editableCells.push({ row, col });
        const wrong = state.puzzle.symbols.find((item) => item !== state.puzzle.solution[row][col]);
        if (!wrong) {
          throw new Error('Wrong symbol not found');
        }
        state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: { row, col } });
        state = sudokuPlugin.handleAction(state, { type: 'input_symbol', payload: { symbol: wrong } });
      }
    }

    expect(state.status).toBe('playing');
    expect(state.errorCells.length).toBeGreaterThan(0);

    for (const { row, col } of editableCells) {
      state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: { row, col } });
      state = sudokuPlugin.handleAction(state, {
        type: 'input_symbol',
        payload: { symbol: state.puzzle.solution[row][col] },
      });
    }

    expect(state.status).toBe('cleared');
    expect(state.errorCells.length).toBe(0);
  });

  test('retry resets transient errors and ui message', () => {
    let state = sudokuPlugin.initGame({ mode: 'normal', date: '2026-02-11', seed: 35 });
    const editable = findEditableCell(state);

    state = sudokuPlugin.handleAction(state, { type: 'select_cell', payload: editable });
    state = sudokuPlugin.handleAction(state, { type: 'input_symbol', payload: { symbol: 'invalid' } });
    expect(state.uiMessage).toBe('Invalid symbol selection.');

    const retried = sudokuPlugin.handleAction(state, { type: 'retry' });
    expect(retried.uiMessage).toBeNull();
    expect(retried.errorCells).toEqual([]);
    expect(retried.status).toBe('playing');
    expect(retried.attempts).toBe(state.attempts + 1);
  });
});
