import React from 'react';
import { act, render } from '@tarojs/test-utils-react/dist/pure';
import PreferenceFeedback from '@/components/PreferenceFeedback';

describe('starlight/preference-feedback', () => {
  test('switches feedback selection', () => {
    let selected: 'liked' | 'disliked' | 'skipped' = 'skipped';

    const tree = render(
      <PreferenceFeedback
        value={selected}
        onChange={(value) => {
          selected = value;
        }}
      />,
      {}
    );

    act(() => {
      const button = tree.container.querySelectorAll('.preference-feedback__button')[0] as HTMLElement;
      button.click();
    });

    expect(selected).toBe('liked');
  });
});
