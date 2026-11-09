import { describe, expect, it } from 'vitest';
import { ACCENT_KEY, approveLines, loadAccent, parseDecision, saveAccent } from '../src/scripts/interactions';
import { ACCENTS } from '../src/scripts/motion';

describe('approve demo', () => {
  it('approving runs the command and the agent continues', () => {
    const lines = approveLines('approve');
    expect(lines[0]).toEqual({ text: '✓ Aprobado desde el teléfono', tone: 'ok' });
    expect(lines.map((l) => l.text)).toContain('$ pnpm test --filter api');
  });
  it('denying never prints the command', () => {
    const lines = approveLines('deny');
    expect(lines[0]).toEqual({ text: '✗ Rechazado desde el teléfono', tone: 'no' });
    expect(lines.some((l) => l.text.includes('$ pnpm'))).toBe(false);
  });
  it('accepts only the two known decisions', () => {
    expect(parseDecision('approve')).toBe('approve');
    expect(parseDecision('deny')).toBe('deny');
    expect(parseDecision('rm -rf')).toBeNull();
    expect(parseDecision(undefined)).toBeNull();
  });
});

describe('accent persistence', () => {
  it('round-trips an offered accent', () => {
    const map = new Map<string, string>();
    const store = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
    saveAccent(store, '#4ADE9E');
    expect(map.get(ACCENT_KEY)).toBe('#4ade9e');
    expect(loadAccent(store)).toBe('#4ade9e');
  });
  it('falls back to the default when storage is empty, tampered, missing or throws', () => {
    expect(loadAccent({ getItem: () => null })).toBe(ACCENTS[0]);
    expect(loadAccent({ getItem: () => 'url(x)' })).toBe(ACCENTS[0]);
    expect(loadAccent(undefined)).toBe(ACCENTS[0]);
    expect(loadAccent({ getItem: () => { throw new Error('blocked'); } })).toBe(ACCENTS[0]);
    expect(() => saveAccent({ setItem: () => { throw new Error('blocked'); } }, '#6b93ff')).not.toThrow();
  });
});
