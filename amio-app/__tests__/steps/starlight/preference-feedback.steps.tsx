import React from 'react';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { act, render } from '@tarojs/test-utils-react/dist/pure';
import PreferenceFeedback from '@/components/PreferenceFeedback';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/starlight/preference-feedback.feature');

defineFeature(feature, (test) => {
  test('Feedback can be saved and switched', ({ given, when, then }) => {
    let selected: 'liked' | 'disliked' | 'skipped' = 'liked';

    given('a preference feedback component', () => {
      selected = 'liked';
    });

    when('I switch feedback from liked to disliked', () => {
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
        const nodes = tree.container.querySelectorAll('.preference-feedback__button');
        const target = nodes[1] as HTMLElement;
        target.click();
      });
    });

    then('selected state should update', () => {
      expect(selected).toBe('disliked');
    });
  });
});
