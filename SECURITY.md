# Security policy

Report vulnerabilities privately through GitHub:
**[Report a vulnerability](https://github.com/lesquel/falconer-web/security/advisories/new)**. Please do not open
a public issue.

## Scope

- The landing page and its headers (`vercel.json`: CSP, framing, caching).
- The `/notify/` PWA: VAPID key generation, the push subscription, the registration code and the
  `/notify/open/` redirect (it only accepts `openmosh:///` targets).

The `/notify/` registration code contains the browser's VAPID private key. Anyone who has it can send
notifications to that browser, so it is only pasted into the app by hand, never passed through a link. "Reset"
on the page rotates it.

The overall threat model is in the [umbrella SECURITY.md](https://github.com/lesquel/falconer/blob/main/SECURITY.md).
