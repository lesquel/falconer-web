/** Pure helpers for the pointer effects, kept free of the DOM so they are unit-tested. */

/** Clamps `v` to [-1, 1]. */
export const unit = (v: number): number => Math.max(-1, Math.min(1, v));

/**
 * Pointer position relative to an element's centre, in [-1, 1] on each axis.
 * Outside the element the value saturates instead of growing.
 */
export function relative(
  pointer: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
): { dx: number; dy: number } {
  if (rect.width <= 0 || rect.height <= 0) return { dx: 0, dy: 0 };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return { dx: unit((pointer.x - cx) / (rect.width / 2)), dy: unit((pointer.y - cy) / (rect.height / 2)) };
}

/** 3D tilt for the phone: up to 10° around Y and 8° around X, facing the pointer. */
export function tilt(dx: number, dy: number): { rx: string; ry: string } {
  return { rx: `${(-unit(dy) * 8).toFixed(2)}deg`, ry: `${(unit(dx) * 10).toFixed(2)}deg` };
}

/** Pupil shift in SVG units (callers pass the room their eye allows; default 5). */
export function pupils(dx: number, dy: number, max = 5): string {
  return `translate(${(unit(dx) * max).toFixed(2)} ${(unit(dy) * max).toFixed(2)})`;
}

/** Accent hex colours the page accepts; anything else falls back to the default. */
export const ACCENTS = ['#6b93ff', '#4ade9e', '#b69cff', '#ffc24d'] as const;

export function safeAccent(value: string | undefined): string {
  const v = (value ?? '').toLowerCase();
  return (ACCENTS as readonly string[]).includes(v) ? v : ACCENTS[0];
}
