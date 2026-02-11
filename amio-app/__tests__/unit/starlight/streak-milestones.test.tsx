import React from 'react';
import { render } from '@tarojs/test-utils-react/dist/pure';
import StreakMilestones from '@/components/StreakMilestones';

describe('starlight/streak-milestones', () => {
  test('shows next milestone hint', () => {
    const tree = render(
      <StreakMilestones
        currentDays={13}
        milestones={[
          { days: 7, label: '7d' },
          { days: 14, label: '14d' },
          { days: 30, label: '30d' },
        ]}
      />,
      {}
    );

    expect(tree.container.textContent).toContain('1 days left');
  });
});
