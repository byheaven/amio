import { defineFeature, loadFeature } from 'jest-cucumber';
import { GameRegistry } from '@/engine/game-registry';
import threeTilesPlugin from '@/games/3tiles';
import sudokuPlugin from '@/games/sudoku';
import mockPlugin from '@/games/mock';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/engine/third-plugin-smoke.feature');

defineFeature(feature, (test) => {
  test('Registering a third plugin works without framework edits', ({ given, when, then }) => {
    const registry = new GameRegistry();
    let count = 0;

    given('a game registry', () => {
      count = 0;
    });

    when('I register built-in plugins and a mock plugin', () => {
      registry.register(threeTilesPlugin);
      registry.register(sudokuPlugin);
      registry.register(mockPlugin);
      count = registry.list().length;
    });

    then('registry lookup should return all three plugins', () => {
      expect(count).toBe(3);
      expect(registry.get('mock').id).toBe('mock');
    });
  });
});
