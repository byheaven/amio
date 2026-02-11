import React from 'react';
import { render } from '@tarojs/test-utils-react/dist/pure';
import TodayGameCard from '@/components/TodayGameCard';

const Thumb: React.FC = () => <></>;

describe('starlight/today-game-card', () => {
  test('renders metadata', () => {
    const tree = render(
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

    expect(tree.container.textContent).toContain('Star Chart Decode');
    expect(tree.container.textContent).toContain('01:22');
  });
});
