# falconer-web

Landing page of [Falconer](https://github.com/lesquel/falconer), built with [Astro](https://astro.build).
Live at **https://falconer-web.vercel.app/** (Vercel, deployed from `main`).
Static output, self-hosted fonts, no analytics and no third-party requests.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm test         # vitest: helpers, brand, site URL, headers and the /notify/ handoff
npm run check    # astro check (needs @astrojs/check; it offers to install it on first run)
npm run build    # static site in dist/
npm run preview  # serve dist/ locally
```

## Structure

| Path | Content |
|---|---|
| `src/pages/index.astro` | The page: composes the sections in order |
| `src/components/` | Header (nav + AccentPicker), Hero (copy + falcon glyph field on a live terminal, InstallCommand), Marquee, About, Problem, Steps (+ ApproveDemo), Bento (features), Agents, Security, Compare, Creator, OpenSource, Faq, FinalCta, Footer, Falcon |
| `src/scripts/falcon-field.ts` | Hero canvas: Herdr-like session, the falcon in terminal glyphs, the swipe-to-approve notification |
| `src/scripts/motion.ts` | Pure helpers (tilt, pupils, accent whitelist), unit-tested |
| `src/scripts/interactions.ts` | Pointer spotlight, 3D tilt, falcon eye, copy buttons, tab demo, remembered accent, approve demo; pure parts exported and unit-tested |
| `src/styles/global.css` | Tokens and keyframes; animations stop with `prefers-reduced-motion` |
| `src/styles/fonts.css`, `font-archivo.css` | Self-hosted Latin woff2 subsets (Inter Tight, JetBrains Mono; Archivo for the hero headline only) |
| `vercel.json` | Security headers (CSP, nosniff, Referrer/Permissions-Policy, framing) and a one-year immutable cache for `/_astro/*` |

The design is "LAN-J · Spotlight" from the Falconer (formerly OpenMosh) design canvas.

## Site URL and social preview

`site` in `astro.config.mjs` is the canonical origin; `src/layouts/Base.astro` derives the canonical link and the
Open Graph/Twitter URLs from it. `public/robots.txt` and the static `public/sitemap.xml` list the landing only (the
`/notify/` pages are `noindex`).

`public/og.png` (1200x630) is rendered from `design/og-image.svg` plus the falcon tile `design/falconer-512.png`.
The SVG uses Inter Tight and JetBrains Mono; point fontconfig at the woff2 files in `node_modules/@fontsource*` and run
`rsvg-convert -w 1200 -h 630 design/og-image.svg -o public/og.png`, then
`magick public/og.png \( design/falconer-512.png -resize 320x320 \) -geometry +96+155 -composite public/og.png`.

## Performance and CSP

CSS is inlined into each page and scripts are always external files (`astro.config.mjs`), so the CSP keeps
`script-src 'self'` with no hashes; `style-src` allows `'unsafe-inline'` for the inlined CSS and the swatch `style`
attributes. Do not add inline `<script>` or third-party origins without updating `vercel.json`. The hero canvas
reuses its buffers, rebuilds the falcon mask only when it changes, and stops (with the hero's CSS animations) while
off screen, in a hidden tab, or with `prefers-reduced-motion`.

## Notifications PWA (/notify/)

`/notify/` is an installable Home-Screen web app that receives Web Push for Falconer. iOS cannot use APNs without a
paid Apple account, so the phone gets pushes through the browser's own push service instead (iOS 16.4+ Safari, or
Android Chrome). It makes its own VAPID key pair and push subscription, then hands both to the Falconer app, which
forwards them over SSH to the hook (`falconer-hook`). Pushes are RFC 8291 (`aes128gcm`) encrypted and generic (no commands or
hostnames). No third-party requests are added.

**iOS steps:** open `/notify/` in Safari, Share, Add to Home Screen, open it from the new icon, tap
"Enable notifications", then "Copy code" and paste it in the Falconer app.

**The code is a secret.** It contains this browser's VAPID private key, so anyone who has it can send
notifications to this browser. It is only copied and pasted by hand: the page offers no deep link, and the app
does not accept codes from links. "Reset" unsubscribes the browser and deletes its keys, which invalidates any
leaked code.

**Hosting:** service workers and Push need HTTPS at the site origin (`localhost` works for development). The blob's
`sub` field is `location.origin`.

**Registration blob** (base64url, no padding, of UTF-8 JSON), pasted into the app:

```json
{"v":1,"endpoint":"…","p256dh":"<65 bytes>","auth":"<16 bytes>","vapid_pub":"<65 bytes>","vapid_priv":"<32 bytes d>","sub":"<origin>"}
```

All binary fields are base64url. **Push payload** (decrypted by the browser):
`{"v":1,"kind":"…","title":"…","body":"…","url":"openmosh:///inbox"}`. Tapping a notification opens
`/notify/open/?to=<url>`, which only accepts `openmosh:///` targets and bounces into the app.

Files: `src/pages/notify/`, `src/scripts/{notify,webpush}.ts`, `public/{notify-sw.js,notify-sw-lib.js,manifest.webmanifest,icons/}`.

The `openmosh:///` URL scheme, the `openmosh-notify` IndexedDB name, the `openmosh-accent` storage key and the
`OpenMoshPush` service-worker global keep the pre-rename name on purpose: the app's notification-tap URLs and
already stored data depend on them.

## Install command

The landing shows the one-line installer
(`curl -fsSL https://raw.githubusercontent.com/lesquel/falconer-hook/main/install.sh | sh`) and, for people who
read scripts before running them, the tag-pinned `v0.2.0/install.sh` to download, inspect and run. The installer
itself verifies the release's checksums and minisign signature.

## Contributing and security

See [CONTRIBUTING.md](./CONTRIBUTING.md). Report vulnerabilities privately as described in
[SECURITY.md](./SECURITY.md). The project's [Code of Conduct](https://github.com/lesquel/falconer/blob/main/CODE_OF_CONDUCT.md)
applies to this repository.

## License

Pending (not chosen yet).
