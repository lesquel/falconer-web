# Contributing to falconer-web

Thanks for helping. This repository is the static landing page of
[Falconer](https://github.com/lesquel/falconer) and the `/notify/` push PWA. How the repositories fit together is
explained in the [umbrella CONTRIBUTING](https://github.com/lesquel/falconer/blob/main/CONTRIBUTING.md).

## Setup

```sh
npm install
npm run dev     # http://localhost:4321
npm test        # vitest
npm run build   # static site in dist/
```

Node `>=22.23.4` (see `package.json`).

## Rules

- Site copy is in Spanish (voseo); `/notify/` is in English. Keep the language of the page you edit.
- No inline `<script>` and no third-party origins: the CSP in `vercel.json` allows only `'self'` scripts.
- Do not claim features the app does not have (for example, offline use).
- Keep the intentional `openmosh` legacy identifiers listed in the README.
- Add or update a test in `tests/` for every behavior change, and run `npm test` and `npm run build` before
  opening a pull request.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …).

## Issues and pull requests

Open them in [lesquel/falconer-web](https://github.com/lesquel/falconer-web). Problems with the app or the hook
belong in [falconer-app](https://github.com/lesquel/falconer-app) or
[falconer-hook](https://github.com/lesquel/falconer-hook).

Security problems: do not open a public issue; see [SECURITY.md](./SECURITY.md).
By participating you agree to the [Code of Conduct](https://github.com/lesquel/falconer/blob/main/CODE_OF_CONDUCT.md).
