import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';

const root = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

interface Rule { source: string; headers: Array<{ key: string; value: string }> }
const vercel = JSON.parse(read('vercel.json')) as { headers: Rule[] };
const headersFor = (path: string) =>
  Object.fromEntries(
    vercel.headers.filter((r) => new RegExp(`^${r.source}$`).test(path)).flatMap((r) => r.headers.map((h) => [h.key, h.value])),
  );

describe('build output', () => {
  it('inlines CSS and never inlines scripts or fonts, so the CSP needs no script hashes', () => {
    expect(config.build?.inlineStylesheets).toBe('always');
    expect(config.vite?.build?.assetsInlineLimit).toBe(0);
  });
  it('ships only the Latin woff2 subsets of the fonts', () => {
    const css = read('src/styles/fonts.css') + read('src/styles/font-archivo.css');
    const files = [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]);
    expect(files).toHaveLength(4);
    for (const f of files) expect(f).toMatch(/-latin-[^/]*\.woff2$/);
    expect(read('src/styles/global.css')).not.toContain('@fontsource');
  });
});

describe('Vercel headers', () => {
  it('caches hashed assets for a year and keeps the service worker fresh', () => {
    expect(headersFor('/_astro/index.abc123.js')['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(headersFor('/notify-sw.js')['Cache-Control']).toBe('no-cache');
    expect(headersFor('/')['Cache-Control']).toBeUndefined();
  });
  it('sends security headers on every path', () => {
    for (const path of ['/', '/notify/', '/notify-sw.js']) {
      const h = headersFor(path);
      expect(h['X-Content-Type-Options'], path).toBe('nosniff');
      expect(h['Referrer-Policy'], path).toBe('strict-origin-when-cross-origin');
      expect(h['Permissions-Policy'], path).toContain('camera=()');
      expect(h['Content-Security-Policy'], path).toBeDefined();
    }
  });
  it('allows only same-origin scripts, workers and fonts, and no framing', () => {
    const csp = headersFor('/')['Content-Security-Policy'];
    const d = Object.fromEntries(csp.split(';').map((s) => s.trim().split(/\s+/)).map(([k, ...v]) => [k, v.join(' ')]));
    expect(d['script-src']).toBe("'self'");
    expect(d['worker-src']).toBe("'self'");
    expect(d['font-src']).toBe("'self'");
    expect(d['object-src']).toBe("'none'");
    expect(d['frame-ancestors']).toBe("'none'");
  });
});
