import { defineFeature, loadFeature } from 'jest-cucumber';
import { GameEngine } from '@/engine/game-engine';
import { gameRegistry } from '@/engine/game-registry';
import { createMockPlugin } from '../../helpers/plugin-factory';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/engine/game-engine-lifecycle.feature');

defineFeature(feature, (test) => {
  test('Engine drives plugin lifecycle and settlement payload', ({ given, when, then }) => {
    const engine = new GameEngine();
    let payload: ReturnType<GameEngine['enterSettlement']> | null = null;

    given('a game engine with registered plugins', () => {
      gameRegistry.register(createMockPlugin('mock-lifecycle'));
      engine.setGame('mock-lifecycle');
    });

    when('I start, act, and finish a game', () => {
      engine.startGame({ mode: 'normal', date: '2026-02-11', userId: 'local-user' });
      engine.dispatch({ type: 'win' });
      payload = engine.enterSettlement({
        gameId: 'mock-lifecycle',
        mode: 'normal',
        status: 'cleared',
        attempts: 1,
        durationSeconds: 12,
        toolsUsed: 0,
        heroAttempted: false,
      });
    });

    then('settlement payload should include result, performance, and chest level', () => {
      expect(payload).not.toBeNull();
      expect(payload?.result.status).toBe('cleared');
      expect(payload?.performance.efficiencyScore).toBeGreaterThan(0);
      expect(['diamond', 'gold', 'silver', 'bronze']).toContain(payload?.chestLevel);
    });
  });
});
