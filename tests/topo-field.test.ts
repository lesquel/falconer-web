import { describe, expect, it } from 'vitest';
import { easeOutBack, formatCountdown, statusLine } from '../src/scripts/topo-field';

describe('approval countdown', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatCountdown(900)).toBe('15:00');
    expect(formatCountdown(899)).toBe('14:59');
    expect(formatCountdown(5)).toBe('0:05');
  });
  it('never goes below zero', () => {
    expect(formatCountdown(-3)).toBe('0:00');
  });
});

describe('status bar', () => {
  it('fills exactly the terminal width', () => {
    for (const cols of [40, 80, 190]) expect(statusLine(cols, '13:05')).toHaveLength(cols);
  });
  it('shows the session on the left and host and time on the right', () => {
    const s = statusLine(120, '13:05');
    expect(s.startsWith(' [api-pagos]')).toBe(true);
    expect(s.trimEnd().endsWith('tu-pc · cifrado E2E · 13:05')).toBe(true);
  });
});

describe('pop-out easing', () => {
  it('starts hidden, overshoots, and settles at one', () => {
    expect(easeOutBack(0)).toBeCloseTo(0);
    expect(Math.max(...[0.6, 0.7, 0.8].map(easeOutBack))).toBeGreaterThan(1);
    expect(easeOutBack(1)).toBe(1);
    expect(easeOutBack(5)).toBe(1);
  });
});
