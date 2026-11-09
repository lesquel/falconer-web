# openmosh-web

Landing page of [OpenMosh](https://github.com/lesquel/OpenMosh), built with [Astro](https://astro.build).
Static output, self-hosted fonts, no analytics and no third-party requests.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm test         # unit tests for the pointer, accent and approve-demo helpers (vitest)
npm run check    # astro check (needs @astrojs/check; it offers to install it on first run)
npm run build    # static site in dist/
npm run preview  # serve dist/ locally
```

## Structure

| Path | Content |
|---|---|
| `src/pages/index.astro` | The page: composes the sections in order |
| `src/components/` | Header (nav + AccentPicker), Hero (copy + Showcase phone and mole, InstallCommand), Marquee, About, Problem, Steps (+ ApproveDemo), Bento (features), Agents, Security, Compare, Creator, OpenSource, Faq, FinalCta, Footer, Mole |
| `src/scripts/motion.ts` | Pure helpers (tilt, pupils, accent whitelist), unit-tested |
| `src/scripts/interactions.ts` | Pointer spotlight, 3D tilt, mole eyes, copy buttons, tab demo, remembered accent, approve demo; pure parts exported and unit-tested |
| `src/styles/global.css` | Tokens and keyframes; animations stop with `prefers-reduced-motion` |

The design is "LAN-J · Spotlight" from the OpenMosh design canvas.
