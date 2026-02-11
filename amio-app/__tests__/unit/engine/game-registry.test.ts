import { GameRegistry } from '@/engine/game-registry';
import { createMockPlugin } from '../../helpers/plugin-factory';

describe('engine/game-registry', () => {
  test('register and get plugin', () => {
    const registry = new GameRegistry();
    registry.register(createMockPlugin('a'));

    expect(registry.get('a').id).toBe('a');
    expect(registry.list()).toHaveLength(1);
  });

  test('throws on unknown plugin id', () => {
    const registry = new GameRegistry();
    expect(() => registry.get('missing')).toThrow('Game plugin not found');
  });
});
