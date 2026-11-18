import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

describe('/notify/ handoff', () => {
  const page = read('src/pages/notify/index.astro');
  const script = read('src/scripts/notify.ts');

  it('never puts the code (it holds the VAPID private key) in a deep link', () => {
    expect(script).not.toContain('handoffLink');
    expect(script).not.toMatch(/webpush\?d=/);
    expect(page).not.toContain('open-link');
    expect(page).not.toContain('Open in Falconer');
  });

  it('keeps the copy and reset buttons and warns that the code is secret', () => {
    expect(page).toContain('id="copy-btn"');
    expect(page).toContain('id="reset-btn"');
    expect(page).toContain('Keep this code secret.');
    expect(page).toContain('Anyone who has it can send notifications to this browser.');
  });
});

describe('install command', () => {
  it('offers a tag-pinned installer to read before running', () => {
    const steps = read('src/components/Steps.astro');
    expect(steps).toContain('https://raw.githubusercontent.com/lesquel/falconer-hook/v0.2.0/install.sh');
    expect(read('src/components/InstallCommand.astro')).toContain(
      'https://raw.githubusercontent.com/lesquel/falconer-hook/main/install.sh | sh',
    );
  });

  it('never claims the product works offline', () => {
    for (const p of ['src/components/Hero.astro', 'src/components/Faq.astro', 'src/components/Security.astro', 'src/pages/notify/index.astro', 'README.md']) {
      expect(read(p), p).not.toMatch(/offline|sin internet|sin conexi[oó]n/i);
    }
  });
});
