import { describe, expect, it } from 'vitest';
import { ACCENTS, pupils, relative, safeAccent, tilt, unit } from '../src/scripts/motion';

const rect = { left: 100, top: 100, width: 200, height: 100 };

describe('relative', () => {
  it('is zero at the centre and ±1 at the edges', () => {
    expect(relative({ x: 200, y: 150 }, rect)).toEqual({ dx: 0, dy: 0 });
    expect(relative({ x: 300, y: 200 }, rect)).toEqual({ dx: 1, dy: 1 });
    expect(relative({ x: 100, y: 100 }, rect)).toEqual({ dx: -1, dy: -1 });
  });
  it('saturates outside the element and ignores empty boxes', () => {
    expect(relative({ x: 5000, y: -5000 }, rect)).toEqual({ dx: 1, dy: -1 });
    expect(relative({ x: 1, y: 1 }, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ dx: 0, dy: 0 });
  });
});

describe('tilt and pupils', () => {
  it('tilts at most 8° and 10°, facing the pointer', () => {
    expect(tilt(1, 1)).toEqual({ rx: '-8.00deg', ry: '10.00deg' });
    expect(tilt(-3, -3)).toEqual({ rx: '8.00deg', ry: '-10.00deg' });
  });
  it('moves the pupils at most 5 units', () => {
    expect(pupils(0, 0)).toBe('translate(0.00 0.00)');
    expect(pupils(2, -2)).toBe('translate(5.00 -5.00)');
  });
  it('unit clamps', () => {
    expect(unit(9)).toBe(1);
    expect(unit(-9)).toBe(-1);
  });
});

describe('safeAccent', () => {
  it('accepts only the offered colours', () => {
    expect(safeAccent('#4ADE9E')).toBe('#4ade9e');
    expect(safeAccent('red; background:url(x)')).toBe(ACCENTS[0]);
    expect(safeAccent(undefined)).toBe(ACCENTS[0]);
  });
});
