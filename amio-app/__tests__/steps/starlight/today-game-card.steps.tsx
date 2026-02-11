import React from 'react';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { render } from '@tarojs/test-utils-react/dist/pure';
import TodayGameCard from '@/components/TodayGameCard';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/starlight/today-game-card.feature');

const Thumb: React.FC = () => <></>;

defineFeature(feature, (test) => {
  test('Card renders metadata from game plugin', ({ given, when, then }) => {
    let tree: ReturnType<typeof render> | null = null;

    given('a game metadata payload', () => {
      tree = null;
    });

    when('I render the today game card in idle state', () => {
      tree = render(
        <TodayGameCard
          meta={{
            id: 'sudoku',
            narrativeName: 'Star Chart Decode',
            narrativeDesc: 'Decode ancient coordinates',
            icon: '🔮',
            thumbnailComponent: Thumb,
            energyReward: 120,
          }}
          cardState="idle"
          bestLabel="01:22"
          onStart={() => {}}
          onHero={() => {}}
          onExit={() => {}}
        />,
        {}
      );
    });

    then('card should display narrative name, description, and reward', () => {
      expect(tree?.container.textContent).toContain('Star Chart Decode');
      expect(tree?.container.textContent).toContain('Decode ancient coordinates');
      expect(tree?.container.textContent).toContain('+120');
    });
  });
});
