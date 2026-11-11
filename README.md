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

## Notifications PWA (/notify/)

`/notify/` is an installable Home-Screen web app that receives Web Push for OpenMosh. iOS cannot use APNs without a
paid Apple account, so the phone gets pushes through the browser's own push service instead (iOS 16.4+ Safari, or
Android Chrome). It makes its own VAPID key pair and push subscription, then hands both to the OpenMosh app, which
forwards them over SSH to `openmosh-hook`. Pushes are RFC 8291 (`aes128gcm`) encrypted and generic (no commands or
hostnames). No third-party requests are added.

**iOS steps:** open `/notify/` in Safari, Share, Add to Home Screen, open it from the new icon, tap
"Enable notifications", then "Open in OpenMosh" (or "Copy code" and paste it in the app).

**Hosting:** service workers and Push need HTTPS at the site origin (`localhost` works for development). The blob's
`sub` field is `location.origin`.

**Registration blob** (base64url, no padding, of UTF-8 JSON), handed off as `openmosh:///webpush?d=<blob>`:

```json
{"v":1,"endpoint":"…","p256dh":"<65 bytes>","auth":"<16 bytes>","vapid_pub":"<65 bytes>","vapid_priv":"<32 bytes d>","sub":"<origin>"}
```

All binary fields are base64url. **Push payload** (decrypted by the browser):
`{"v":1,"kind":"…","title":"…","body":"…","url":"openmosh:///inbox"}`. Tapping a notification opens
`/notify/open/?to=<url>`, which only accepts `openmosh:///` targets and bounces into the app.

Files: `src/pages/notify/`, `src/scripts/{notify,webpush}.ts`, `public/{notify-sw.js,notify-sw-lib.js,manifest.webmanifest,icons/}`.
