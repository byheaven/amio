import React from 'react';
import { render } from '@tarojs/test-utils-react/dist/pure';
import HeroTimer from '@/games/sudoku/components/HeroTimer';

describe('sudoku/hero-timer-ux', () => {
  test('applies danger state at or below 30 seconds', () => {
    const tree = render(<HeroTimer remainingSeconds={30} totalSeconds={180} />, {});
    const timer = tree.container.querySelector('.hero-timer');
    expect(timer).not.toBeNull();
    expect(timer?.className).toContain('hero-timer--danger');
    expect(timer?.getAttribute('data-danger')).toBe('true');
  });

  test('shows non-danger state above 30 seconds and correct bar width', () => {
    const tree = render(<HeroTimer remainingSeconds={90} totalSeconds={180} />, {});
    const timer = tree.container.querySelector('.hero-timer');
    const bar = tree.container.querySelector('.hero-timer__bar') as HTMLElement | null;

    expect(timer?.className).not.toContain('hero-timer--danger');
    expect(timer?.getAttribute('data-danger')).toBe('false');
    expect(bar?.getAttribute('style')).toContain('width: 50%');
  });
});
