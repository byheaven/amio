import React from 'react';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { render } from '@tarojs/test-utils-react/dist/pure';
import TodayGameCard from '@/components/TodayGameCard';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/starlight/post-clear-card-state.feature');

const Thumb: React.FC = () => <></>;

defineFeature(feature, (test) => {
  test('Card enters completed state with hero action', ({ given, when, then }) => {
    let tree: ReturnType<typeof render> | null = null;

    given('a completed card state', () => {
      tree = null;
    });

    when('I render the card', () => {
      tree = render(
        <TodayGameCard
          meta={{
            id: '3tiles',
            narrativeName: 'Three Tiles',
            narrativeDesc: 'desc',
            icon: '🀄️',
            thumbnailComponent: Thumb,
            energyReward: 120,
          }}
          cardState="completed"
          onStart={() => {}}
          onHero={() => {}}
          onExit={() => {}}
        />,
        {}
      );
    });

    then('it should expose hero challenge and done controls', () => {
      expect(tree?.container.textContent).toContain('挑战英雄模式');
      expect(tree?.container.textContent).toContain('去星海看看');
    });
  });
});
