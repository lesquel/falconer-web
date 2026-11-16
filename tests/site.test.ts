import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';

const SITE = 'https://falconer-web.vercel.app';
const root = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

describe('site URL', () => {
  it('declares the live origin in the Astro config', () => {
    expect(config.site).toBe(SITE);
  });
  it('emits canonical, Open Graph and Twitter tags from absolute URLs', () => {
    const base = read('src/layouts/Base.astro');
    expect(base).toContain('<link rel="canonical" href={canonical} />');
    for (const tag of ['og:url', 'og:image', 'og:title', 'og:description', 'twitter:card', 'twitter:image']) {
      expect(base, tag).toContain(`"${tag}"`);
    }
    expect(base).toContain("new URL('/og.png', Astro.site)");
  });
  it('ships a 1200x630 Open Graph image', () => {
    const png = readFileSync(join(root, 'public/og.png'));
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
  it('points robots.txt at the sitemap and lists only the landing in it', () => {
    expect(read('public/robots.txt')).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    const locs = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([`${SITE}/`]);
  });
  it('links the README to the live site', () => {
    expect(read('README.md')).toContain(SITE);
  });
});
