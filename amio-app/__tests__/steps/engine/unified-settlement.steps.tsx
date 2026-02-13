import React from 'react';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { render } from '@tarojs/test-utils-react/dist/pure';
import GameSettlement from '@/components/GameSettlement';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/engine/unified-settlement.feature');

const Thumb: React.FC = () => null;

defineFeature(feature, (test) => {
  test('Settlement renders generic result and hero entry', ({ given, when, then }) => {
    let tree: ReturnType<typeof render> | null = null;

    given('a generic settlement payload', () => {
      tree = null;
    });

    when('I render the settlement component', () => {
      tree = render(
        <GameSettlement
          gameMeta={{
            id: 'sudoku',
            narrativeName: 'Star Chart Decode',
            narrativeDesc: 'desc',
            icon: '🔮',
            thumbnailComponent: Thumb,
            energyReward: 120,
          }}
          result={{
            gameId: 'sudoku',
            mode: 'normal',
            status: 'cleared',
            attempts: 1,
            durationSeconds: 90,
            toolsUsed: 0,
            heroAttempted: false,
          }}
          chestLevel="gold"
          heroAvailable
          feedback="skipped"
          onFeedbackChange={() => {}}
          onHeroChallenge={() => {}}
          onDone={() => {}}
        />,
        {}
      );
    });

    then('it should show chest, feedback, and hero action when enabled', () => {
      expect(tree?.container.textContent).toContain('宝箱：黄金');
      expect(tree?.container.textContent).toContain('你觉得这个模式怎么样？');
      expect(tree?.container.textContent).toContain('挑战英雄模式');
    });
  });
});
