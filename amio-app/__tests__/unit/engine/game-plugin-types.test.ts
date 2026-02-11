import { createMockPlugin } from '../../helpers/plugin-factory';

describe('engine/game-plugin-types', () => {
  test('mock plugin matches expected contract shape', () => {
    const plugin = createMockPlugin('shape');

    expect(plugin.id).toBe('shape');
    expect(typeof plugin.initGame).toBe('function');
    expect(typeof plugin.handleAction).toBe('function');
    expect(typeof plugin.getPerformance).toBe('function');
    expect(plugin.getTools().length).toBeGreaterThan(0);
  });
});
