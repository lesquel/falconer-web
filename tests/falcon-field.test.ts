import { describe, expect, it } from 'vitest';
import { easeOutBack, formatCountdown, maskSignature, shouldAnimate, statusLine } from '../src/scripts/falcon-field';

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

describe('animation budget', () => {
  const base = { onScreen: true, tabHidden: false, reduceMotion: false };
  it('animates only on screen, in a visible tab, with motion allowed', () => {
    expect(shouldAnimate(base)).toBe(true);
    expect(shouldAnimate({ ...base, onScreen: false })).toBe(false);
    expect(shouldAnimate({ ...base, tabHidden: true })).toBe(false);
    expect(shouldAnimate({ ...base, reduceMotion: true })).toBe(false);
  });
});

describe('falcon mask reuse', () => {
  const idle = { cols: 180, rows: 48, rise: 1, look: 0 as const, pointerT: 0, red: false };
  it('is reused while nothing that shapes the falcon changes', () => {
    expect(maskSignature(idle)).toBe(maskSignature({ ...idle, pointerT: 123 }));
  });
  it('is rebuilt when the size, the rise, the gaze or the iris flash changes', () => {
    const key = maskSignature(idle);
    for (const change of [{ cols: 181 }, { rows: 47 }, { rise: 0.98 }, { look: 2 as const }, { red: true }]) {
      expect(maskSignature({ ...idle, ...change }), JSON.stringify(change)).not.toBe(key);
    }
  });
  it('follows every pointer move while the falcon looks at the cursor', () => {
    const looking = { ...idle, look: 1 as const, pointerT: 10 };
    expect(maskSignature(looking)).not.toBe(maskSignature({ ...looking, pointerT: 11 }));
  });
});
