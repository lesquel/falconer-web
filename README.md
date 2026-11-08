# openmosh-web

Landing page of [OpenMosh](https://github.com/lesquel/OpenMosh), built with [Astro](https://astro.build).
Static output, self-hosted fonts, no analytics and no third-party requests.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm test         # unit tests for the pointer helpers (vitest)
npm run build    # static site in dist/
```

## Structure

| Path | Content |
|---|---|
| `src/pages/index.astro` | The page: composes the sections |
| `src/components/` | Header, Hero, InstallCommand, Showcase (phone + mole), Marquee, Bento, Footer, Mole |
| `src/scripts/motion.ts` | Pure helpers (tilt, pupils, accent whitelist), unit-tested |
| `src/scripts/interactions.ts` | Pointer spotlight, 3D tilt, mole eyes, copy button, tab and accent demos |
| `src/styles/global.css` | Tokens and keyframes; animations stop with `prefers-reduced-motion` |

The design is "LAN-J · Spotlight" from the OpenMosh design canvas.
