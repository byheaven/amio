import React from 'react';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { render } from '@tarojs/test-utils-react/dist/pure';
import StreakMilestones from '@/components/StreakMilestones';
import '../../helpers/bdd-setup';

const feature = loadFeature('__tests__/features/starlight/streak-milestones.feature');

defineFeature(feature, (test) => {
  test('Milestone states show completed, next, and future', ({ given, when, then }) => {
    let tree: ReturnType<typeof render> | null = null;

    given('streak milestones with current progress', () => {
      tree = null;
    });

    when('I render the milestones component', () => {
      tree = render(
        <StreakMilestones
          currentDays={13}
          milestones={[
            { days: 7, label: '7d reward' },
            { days: 14, label: '14d sticker' },
            { days: 30, label: '30d charm' },
          ]}
        />,
        {}
      );
    });

    then('next milestone hint should be displayed', () => {
      expect(tree?.container.textContent).toContain('1 days left');
    });
  });
});
