import { defineFeature, loadFeature } from 'jest-cucumber';
import { createMockPlugin } from '../../helpers/plugin-factory';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/engine/game-plugin-contract.feature');

defineFeature(feature, (test) => {
  test('Plugin contract enforcement', ({ given, when, then }) => {
    let plugin = createMockPlugin('contract');
    let hasRequiredFields = false;

    given('a registered game plugin', () => {
      plugin = createMockPlugin('contract');
    });

    when('I inspect its required fields', () => {
      hasRequiredFields = Boolean(
        plugin.id &&
        plugin.meta &&
        plugin.initGame &&
        plugin.handleAction &&
        plugin.getStatus &&
        plugin.getPerformance &&
        plugin.getTools &&
        plugin.useTool &&
        plugin.getHeroConfig &&
        plugin.GameComponent
      );
    });

    then('it should expose id, meta, lifecycle methods, tools, and hero config', () => {
      expect(hasRequiredFields).toBe(true);
    });
  });
});
