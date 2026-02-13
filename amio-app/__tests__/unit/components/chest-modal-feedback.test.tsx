import React from 'react';
import { render } from '@tarojs/test-utils-react/dist/pure';
import ChestModal from '@/components/ChestModal/ChestModal';
import { ChestLevel, GameMode } from '@/constants/game';

describe('components/chest-modal-feedback', () => {
  test('renders feedback options and emits feedback change', () => {
    const onFeedbackChange = jest.fn();

    const tree = render(
      <ChestModal
        chestLevels={[ChestLevel.GOLD]}
        stats={{
          attempts: 1,
          toolsUsed: 0,
          undoUsed: false,
          shuffleUsed: false,
          popUsed: false,
        }}
        gameMode={GameMode.NORMAL}
        canChallengeHero={false}
        feedback="skipped"
        onFeedbackChange={onFeedbackChange}
        onClaim={jest.fn()}
        onHeroChallenge={jest.fn()}
        onClose={jest.fn()}
      />,
      {}
    );

    expect(tree.container.textContent).toContain('喜欢');
    expect(tree.container.textContent).toContain('不喜欢');

    const options = Array.from(tree.container.querySelectorAll('.feedback-option')) as HTMLElement[];
    if (options.length < 2) {
      throw new Error('Feedback options not found');
    }
    options[0].click();
    options[1].click();

    expect(onFeedbackChange).toHaveBeenNthCalledWith(1, 'liked');
    expect(onFeedbackChange).toHaveBeenNthCalledWith(2, 'disliked');
  });
});
