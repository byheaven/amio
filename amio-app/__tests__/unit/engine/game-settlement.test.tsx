import React from 'react';
import { render } from '@tarojs/test-utils-react/dist/pure';
import GameSettlement from '@/components/GameSettlement';

const Thumb: React.FC = () => <></>;

describe('components/GameSettlement', () => {
  test('renders hero action when hero available', () => {
    const tree = render(
      <GameSettlement
        gameMeta={{
          id: '3tiles',
          narrativeName: 'Three Tiles',
          narrativeDesc: 'desc',
          icon: '🀄️',
          thumbnailComponent: Thumb,
          energyReward: 120,
        }}
        result={{
          gameId: '3tiles',
          mode: 'normal',
          status: 'cleared',
          attempts: 1,
          durationSeconds: 50,
          toolsUsed: 0,
          heroAttempted: false,
        }}
        chestLevel="diamond"
        heroAvailable
        feedback="skipped"
        onFeedbackChange={() => {}}
        onHeroChallenge={() => {}}
        onDone={() => {}}
      />,
      {}
    );

    expect(tree.container.textContent).toContain('挑战英雄模式');
    expect(tree.container.textContent).toContain('宝箱：钻石');
  });
});
