import { defineFeature, loadFeature } from 'jest-cucumber';
import { calculateChestLevel, upgradeChestForHero } from '@/utils/chestLogic';
import { ChestLevel } from '@/constants/game';
import { createGameStats } from '../../helpers/game-stats-factory';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/chest/chest-calculation.feature');

defineFeature(feature, (test) => {
  test('Calculate chest level for normal mode', ({ given, and, when, then }) => {
    let attempts: number;
    let toolsUsed: number;
    let result: ChestLevel;

    given(/^the player completed the level in (\d+) attempts?$/, (attemptsStr) => {
      attempts = parseInt(attemptsStr, 10);
    });

    and(/^the player used (\d+) tools?$/, (toolsStr) => {
      toolsUsed = parseInt(toolsStr, 10);
    });

    when('the chest level is calculated', () => {
      const stats = createGameStats({ attempts, toolsUsed });
      result = calculateChestLevel(stats);
    });

    then(/^the chest should be (.+)$/, (expectedLevel) => {
      expect(result).toBe(expectedLevel);
    });
  });

  test('Upgrade chest for Hero mode completion', ({ given, when, then }) => {
    let originalLevel: ChestLevel;
    let upgradedChests: ChestLevel[];

    given(/^the player earned a (.+) chest in normal mode$/, (levelStr) => {
      originalLevel = levelStr as ChestLevel;
    });

    when('the chest is upgraded for Hero mode', () => {
      upgradedChests = upgradeChestForHero(originalLevel);
    });

    then(/^the player should receive (.+)$/, (expectedChestsStr) => {
      const expectedChests = expectedChestsStr
        .split(',')
        .map((s) => s.trim()) as ChestLevel[];
      expect(upgradedChests).toEqual(expectedChests);
    });
  });

  test('Edge case - zero attempts should not crash', ({ given, and, when, then }) => {
    let attempts: number;
    let toolsUsed: number;
    let result: ChestLevel;

    given(/^the player completed the level in (\d+) attempts?$/, (attemptsStr) => {
      attempts = parseInt(attemptsStr, 10);
    });

    and(/^the player used (\d+) tools?$/, (toolsStr) => {
      toolsUsed = parseInt(toolsStr, 10);
    });

    when('the chest level is calculated', () => {
      const stats = createGameStats({ attempts, toolsUsed });
      result = calculateChestLevel(stats);
    });

    then(/^the chest should be (.+)$/, (expectedLevel) => {
      expect(result).toBe(expectedLevel);
    });
  });
});
