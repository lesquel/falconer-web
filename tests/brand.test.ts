import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = join(import.meta.dirname, '../src/components');
const read = (name: string) => readFileSync(join(dir, name), 'utf8');

describe('Falconer brand', () => {
  it('names the product Falconer in the header and the hero', () => {
    expect(read('Header.astro')).toMatch(/aria-label="Falconer, inicio"[\s\S]*falconer/);
    expect(read('Hero.astro')).toContain('<b>Falconer v0.2.0</b>');
    expect(read('Hero.astro')).toContain('el halcón vuela');
  });
  it('keeps no OpenMosh, Topo or mole leftovers in any component', () => {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.astro'))) {
      expect(read(file), file).not.toMatch(/openmosh|\btopo\b|\bmole\b/i);
    }
  });
});
