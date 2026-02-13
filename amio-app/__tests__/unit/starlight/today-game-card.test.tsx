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
        onStart={() => {}}
        onHero={() => {}}
        onExit={() => {}}
      />,
      {}
    );

    expect(tree.container.textContent).toContain('+120');
  });
});
