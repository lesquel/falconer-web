/**
 * Hero "Falcon Field": a living Herdr session drawn on one canvas, with the Falconer falcon
 * built from terminal glyphs, a pointer that ruffles the text, and a push notification the
 * visitor approves by sliding. One canvas, ~30 fps, paused off-screen, hidden tab or reduced motion.
 */

export type Line = [text: string, bright: number];

/** "14:59" style countdown for an approval that expires after `total` seconds. */
export function formatCountdown(secondsLeft: number): string {
  const s = Math.max(0, Math.floor(secondsLeft));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Herdr-like status bar, exactly `cols` characters wide. */
export function statusLine(cols: number, time: string): string {
  const left = ' [api-pagos] 1:claude* 2:codex 3:gemini';
  const right = `tu-pc · cifrado E2E · ${time} `;
  const gap = Math.max(1, cols - left.length - right.length);
  return (left + ' '.repeat(gap) + right).slice(0, cols).padEnd(cols);
}

/** Ease-out with a small overshoot: the falcon rises onto its perch. */
export function easeOutBack(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  const c = 1.7;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
}

const CORPUS: Line[] = [
  ['> agrega tests al endpoint de pagos', 1], ['● Read src/payments.ts', 0], ['● Edit tests/payments.spec.ts (+42 -3)', 0],
  ['  ⎿ 12 passed (1.8s)', 0], ['● Bash(npm run lint)', 0], ['  ⎿ 0 problems', 0], ['> arreglá el menú en celulares', 1],
  ['● Edit src/components/Header.astro', 0], ['  ⎿ 1 page(s) built in 488ms', 0], ['$ git status', 1], ['On branch feat/pagos', 0],
  ['● Write docs/payments.md', 0], ['Attached image: ~/.openmosh/uploads/pizarron.jpg', 0], ['● Thinking…', 0],
  ['● Grep "refund" in src/', 0], ['  ⎿ 7 matches in 3 files', 0], ['codex › running cargo test', 0], ['test result: ok. 331 passed', 0],
  ['● Edit src/checkout/total.ts', 0], ['● Bash(npx vitest run)', 0], ['  ⎿ 11 passed', 0],
  ['● Read package.json', 0], ['gemini › reviewing diff (4 files)', 0], ['● Update todos', 0], ['  ☐ migrate refunds table', 0], ['  ☒ add idempotency key', 0],
];
const BOOT: Line[] = [['$ ssh tu-pc', 1], ['Conectado por Tailscale · 100.•••.•••.12', 0], ['$ falconer-hook attach herdr', 1], ['herdr · espejo activo · 3 pestañas', 0], ['', 0]];
const TABS = [' 1 claude · api-pagos', ' 2 codex · landing', ' 3 gemini · docs'];
const RAMP = ' .:-=+*#%@';
const SCRAMBLE = '#%&@*+=~$/<>';

/** Path data of public/falconer.svg (100x100 viewBox), reused to draw the falcon in glyphs. */
const FALCON = {
  light: 'M30 100 C28 82 26 66 30 54 C33 36 46 24 60 24 C70 24 77 29 80 36 L86 40 C90 43 91 49 89 54 C88 58 85 61 81 62 C82 58 82 55 80 53 C77 55 73 56 70 56 C68 66 68 80 72 100 Z',
  dark: 'M30 100 C28 82 26 66 30 54 C33 36 46 24 60 24 C70 24 77 29 80 36 L76 40 C72 38 68 38 64 40 C58 44 56 52 56 62 C56 68 52 70 49 66 C47 62 46 56 44 52 C40 58 38 70 40 100 Z',
  streaks: 'M35 76 C37 68 39 62 42 57 M32 92 C33 85 34 79 36 73 M44 32 C50 28 56 27 62 28',
  cere: 'M75 35.5 C79.5 36.5 83 39 85.5 42.5 L80 47.5 C79 43.5 77 41 73.5 39.5 Z',
  beak: 'M85.5 42.5 C89.5 45 91 49.5 89 54.5 C88 58 85 61 81 62 C82 58 82 55 80 52.5 L80 47.5 Z',
} as const;

interface Ask { kind: 'ask'; agent: string; proj: string; cmd: string; pane: number; ok: string[] }
interface Done { kind: 'done'; agent: string; proj: string; body: string; pane: number }
const EVENTS: Array<Ask | Done> = [
  { kind: 'ask', agent: 'Claude Code', proj: 'api-pagos', cmd: 'git push origin feat/pagos', pane: 0,
    ok: ['✓ Aprobado desde el teléfono', '● Bash(git push origin feat/pagos)', '  ⎿ feat/pagos -> feat/pagos'] },
  { kind: 'done', agent: 'Codex', proj: 'landing', body: 'Terminó. El build pasó: 1 página en 488 ms.', pane: 1 },
  { kind: 'ask', agent: 'Gemini CLI', proj: 'docs', cmd: 'rm -rf dist/', pane: 2,
    ok: ['✓ Aprobado desde el teléfono', '● Bash(rm -rf dist/)', '  ⎿ done'] },
];

const pick = (): Line => CORPUS[(Math.random() * CORPUS.length) | 0];
const noise = () => SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
const hhmm = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function initFalconField(hero: HTMLElement): void {
  const cv = hero.querySelector<HTMLCanvasElement>('[data-falcon-canvas]');
  const notif = hero.querySelector<HTMLElement>('[data-falcon-notif]');
  const ctx = cv?.getContext('2d');
  if (!cv || !notif || !ctx) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let accent = '#6b93ff';
  const colors = () => ['#24242c', '#474752', '#8b8b95', '#f5f5f7', accent];
  const readAccent = () => { accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || accent; };
  readAccent();

  let W = 0, H = 0, cw = 8, ch = 17, cols = 0, rows = 0, panes = 1, paneW = 0, frame = 0, flash = 0, blink = 0;
  let heat = new Float32Array(0), bright = new Float32Array(0), accm = new Uint8Array(0), clr = new Uint8Array(0);
  let lines: Line[][] = [];
  const pulses: Array<{ x: number; y: number; t: number; v: number }> = [];
  const parts: Array<{ x: number; y: number; vx: number; vy: number; life: number; ch: string; acc: boolean }> = [];
  const pointer = { x: 0, y: 0, t: -1e9 };
  let riseT0 = 0;
  let bounce: { t0: number; dur: number; amp: number } | null = null;

  function layout() {
    const r = cv!.getBoundingClientRect();
    W = r.width; H = r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv!.width = Math.round(W * dpr); cv!.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fs = W < 640 ? 10 : 13;
    ctx!.font = `${fs}px "JetBrains Mono", monospace`;
    ctx!.textBaseline = 'top';
    cw = ctx!.measureText('M').width; ch = Math.round(fs * 1.35);
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
    panes = W < 640 ? 1 : W < 1000 ? 2 : 3;
    paneW = Math.floor((cols - (panes - 1)) / panes);
    heat = new Float32Array(cols * rows);
    lines = Array.from({ length: panes }, () => Array.from({ length: rows }, (): Line => ['', 0]));
  }

  function riseNow(now: number): number {
    if (reduce) return 1;
    let r = riseT0 ? easeOutBack((now - riseT0) / 1100) : 0;
    if (bounce) {
      const b = (now - bounce.t0) / bounce.dur;
      if (b >= 1) bounce = null; else r += bounce.amp * Math.sin(Math.PI * b);
    }
    return r;
  }

  // The falcon is drawn on a small offscreen canvas (one pixel per cell, y stretched so shapes
  // stay round) and sampled. R = brightness, G = accent (255 iris, 120 eye ring and cere),
  // B = clear text. Its paths are the ones of public/falconer.svg (100x100 viewBox).
  const oc = document.createElement('canvas');
  const o = oc.getContext('2d', { willReadFrequently: true })!;
  const P = {
    light: new Path2D(FALCON.light), dark: new Path2D(FALCON.dark), streaks: new Path2D(FALCON.streaks),
    cere: new Path2D(FALCON.cere), beak: new Path2D(FALCON.beak),
  };
  function buildMask(now: number) {
    const k = ch / cw;
    oc.width = cols; oc.height = Math.ceil(rows * k);
    const narrow = W < 640;
    const cx = cols * (narrow ? 0.5 : 0.71);
    const s = oc.height * (narrow ? 0.22 : 0.6);
    const base = oc.height * (narrow ? 0.36 : 0.93);
    const rise = riseNow(now);
    const lift = (1 - rise) * s * 1.3;
    const u = s / 60; // one SVG unit, in mask pixels
    const x0 = cx - 58 * u, y0 = base + lift - 100 * u;
    const ell = (x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient) => {
      o.fillStyle = fill; o.beginPath(); o.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); o.fill();
    };
    // Gradients are built in SVG units, under the falcon transform.
    const shade = (x: number, y: number, r: number, a: number, b: number) => {
      const g = o.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r * 1.1);
      g.addColorStop(0, `rgb(${a},0,0)`); g.addColorStop(1, `rgb(${b},0,0)`); return g;
    };
    // The falcon looks at the cursor if it moved lately, else at the notification, else ahead.
    let tx = 0, ty = 0, look = false;
    if (now - pointer.t < 2500) { tx = pointer.x; ty = pointer.y * k; look = true; }
    else if (notif!.classList.contains('show')) { tx = cols * 0.5; ty = 0; look = true; }
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, oc.width, oc.height);
    ell(cx - s * 0.05, base - s * 0.62, s * 0.66, s * 0.74, 'rgb(0,0,255)');
    ell(cx, base, s * 1.0, s * 0.2, 'rgb(0,0,255)');
    o.save(); o.beginPath(); o.rect(0, 0, oc.width, base + s * 0.02); o.clip();
    o.setTransform(u, 0, 0, u, x0, y0);
    o.fillStyle = shade(66, 48, 40, 255, 165); o.fill(P.light);
    o.fillStyle = shade(56, 40, 44, 105, 38); o.fill(P.dark);
    o.strokeStyle = 'rgb(150,0,0)'; o.lineWidth = 2.4; o.lineCap = 'round'; o.stroke(P.streaks);
    ell(66, 43, 7.4, 7.4, 'rgb(40,0,0)');
    o.fillStyle = 'rgb(150,120,0)'; o.fill(P.cere);
    o.fillStyle = 'rgb(115,0,0)'; o.fill(P.beak);
    ell(66, 43, 5.6, 5.6, 'rgb(150,120,0)');
    const ex = x0 + 66 * u, ey = y0 + 43 * u;
    const vx = tx - ex, vy = ty - ey, m = Math.hypot(vx, vy) || 1;
    const ox = look ? (vx / m) * 1.2 : 0, oy = look ? (vy / m) * 1.2 : 0;
    ell(66, 43, 4.2, 4.2, flash > 0 && flash % 4 < 2 ? 'rgb(255,0,0)' : 'rgb(255,255,0)');
    ell(66 + ox, 43 + oy, 2.3, 2.3, 'rgb(18,0,255)');
    ell(66 + ox * 1.4 - 1.2, 43 + oy * 1.4 - 1.2, 0.9, 0.9, 'rgb(255,0,0)');
    o.restore();
    // The perch, and the talons once the falcon has landed on it.
    ell(cx, base, s * 0.86, s * 0.1, shade(cx, base, s * 0.86, 90, 45));
    ell(cx, base + s * 0.01, s * 0.5, s * 0.04, 'rgb(0,0,255)');
    if (rise > 0.85) {
      ell(cx - s * 0.3, base - s * 0.04, s * 0.11, s * 0.05, 'rgb(225,0,0)');
      ell(cx + s * 0.1, base - s * 0.04, s * 0.11, s * 0.05, 'rgb(225,0,0)');
    }
    const d = o.getImageData(0, 0, oc.width, oc.height).data;
    if (bright.length !== cols * rows) { bright = new Float32Array(cols * rows); accm = new Uint8Array(cols * rows); clr = new Uint8Array(cols * rows); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const py = Math.min(oc.height - 1, Math.floor(r * k + k / 2));
      const idx = (py * oc.width + c) * 4, i = r * cols + c;
      bright[i] = d[idx] / 255;
      accm[i] = d[idx + 1] > 200 ? 2 : d[idx + 1] > 80 ? 1 : 0;
      clr[i] = d[idx + 2] > 128 ? 1 : 0;
    }
  }

  function rowText(r: number): [string, number | number[]] {
    if (r === 0) {
      let t = '';
      for (let p = 0; p < panes; p++) { t += (TABS[p] ?? '').padEnd(paneW).slice(0, paneW); if (p < panes - 1) t += '│'; }
      return [t, 1];
    }
    if (r === rows - 1) {
      const st = statusLine(cols, hhmm());
      return [st, Array.from(st, (_, j) => (j >= 1 && j <= 11 ? 4 : 2))];
    }
    let s = ''; const b: number[] = [];
    for (let q = 0; q < panes; q++) {
      const ln: Line = r === rows - 2 && q === 0 ? [`~/api-pagos $ ${blink % 2 ? '█' : ' '}`, 1] : lines[q][r];
      s += ln[0].padEnd(paneW).slice(0, paneW);
      for (let j = 0; j < paneW; j++) b.push(ln[1]);
      if (q < panes - 1) { s += '│'; b.push(0); }
    }
    return [s, b];
  }

  function draw() {
    const now = performance.now();
    frame++;
    if (frame % 15 === 0) readAccent();
    if (frame % 2 === 0 || now - riseT0 < 1300 || bounce || flash > 0) buildMask(now);
    const palette = colors();
    ctx!.fillStyle = '#050507'; ctx!.fillRect(0, 0, W, H);
    ctx!.fillStyle = '#101016'; ctx!.fillRect(0, (rows - 1) * ch - 2, W, ch + 4);
    for (let pi = pulses.length - 1; pi >= 0; pi--) {
      const P = pulses[pi], rad = ((now - P.t) / 1000) * 52;
      if (rad > cols + rows * 2.5) { pulses.splice(pi, 1); continue; }
      for (let rr = 0; rr < rows - 1; rr++) for (let cc = 0; cc < cols; cc++) {
        const dd = Math.hypot(cc - P.x, (rr - P.y) * (ch / cw));
        if (Math.abs(dd - rad) < 2.4) heat[rr * cols + cc] = P.v;
      }
    }
    const bufs: string[][] = [[], [], [], [], []];
    const out: string[][] = [[], [], [], [], []];
    for (let r = 0; r < rows; r++) {
      const [s, bb] = rowText(r);
      const bar = r === rows - 1;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c, h = heat[i], br = bright[i];
        let chr = s[c] ?? ' ', bucket = typeof bb === 'number' ? bb : (bb[c] ?? 0);
        if (h > 0.08 && !bar) {
          chr = noise(); bucket = h > 0.45 ? 4 : 2; heat[i] = h * 0.92;
        } else {
          if (h) heat[i] = 0;
          if (bar) { /* status bar stays as is */ }
          else if (accm[i] === 2) { chr = '@'; bucket = 4; }
          else if (accm[i] === 1) { chr = '='; bucket = 4; }
          else if (br > 0.06) {
            chr = RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.round(br * (RAMP.length - 1))))];
            bucket = br > 0.62 ? 3 : br > 0.3 ? 2 : 1;
          } else if (clr[i]) chr = ' ';
        }
        for (let bI = 0; bI < 5; bI++) out[bI][c] = bI === bucket ? chr : ' ';
      }
      for (let bJ = 0; bJ < 5; bJ++) { out[bJ].length = cols; bufs[bJ].push(out[bJ].join('')); }
    }
    for (let k2 = 0; k2 < 5; k2++) {
      ctx!.fillStyle = palette[k2];
      for (let r2 = 0; r2 < rows; r2++) if (bufs[k2][r2].trim()) ctx!.fillText(bufs[k2][r2], 0, r2 * ch);
    }
    for (let n = parts.length - 1; n >= 0; n--) {
      const p = parts[n];
      p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.life -= 0.028;
      if (p.life <= 0 || p.y > H) { parts.splice(n, 1); continue; }
      ctx!.globalAlpha = p.life; ctx!.fillStyle = p.acc ? accent : '#8b8b95'; ctx!.fillText(p.ch, p.x, p.y);
    }
    ctx!.globalAlpha = 1;
    if (flash > 0) flash--;
  }

  function ruffle(x: number, y: number, spray: number) {
    const c0 = x / cw, r0 = y / ch, R = W < 640 ? 4 : 5;
    for (let r = Math.max(0, (r0 - R) | 0); r < Math.min(rows - 1, r0 + R + 1); r++)
      for (let c = Math.max(0, (c0 - R * 2) | 0); c < Math.min(cols, c0 + R * 2 + 1); c++) {
        const d = Math.hypot((c - c0) / 2, r - r0);
        if (d < R) { const i = r * cols + c; heat[i] = Math.max(heat[i], 1 - d / R); }
      }
    if (!reduce) for (let n = 0; n < spray && parts.length < 180; n++)
      parts.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 4 - 1.5, life: 1, ch: noise(), acc: Math.random() < 0.45 });
  }

  const skip = (t: EventTarget | null) => t instanceof Element && t.closest('[data-falcon-notif], [data-falcon-copy]');
  hero.addEventListener('pointermove', (e) => {
    if (skip(e.target)) return;
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    pointer.x = x / cw; pointer.y = y / ch; pointer.t = performance.now();
    ruffle(x, y, Math.min(4, Math.round(Math.hypot(e.movementX || 0, e.movementY || 0) / 8)));
    if (reduce) { buildMask(pointer.t); draw(); }
  });
  hero.addEventListener('pointerdown', (e) => {
    if (skip(e.target)) return;
    const r = cv.getBoundingClientRect();
    ruffle(e.clientX - r.left, e.clientY - r.top, 14);
  });

  function pushLine(p: number, t: string, b: number) {
    const pane = p < panes ? p : 0;
    const a = lines[pane]; a.splice(1, 1);
    a.splice(pane === 0 ? rows - 3 : rows - 2, 0, [t, b]);
  }

  let running = false, visible = true, last = 0;
  const loop = (t: number) => {
    if (!running) return;
    if (t - last > 33) { last = t; draw(); }
    requestAnimationFrame(loop);
  };
  const setRun = () => {
    const want = visible && !document.hidden && !reduce;
    if (want && !running) { running = true; requestAnimationFrame(loop); } else if (!want) running = false;
  };
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; setRun(); }).observe(hero);
  document.addEventListener('visibilitychange', setRun);
  document.addEventListener('falconer:accent', () => { readAccent(); if (reduce) draw(); });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      layout();
      for (let j = 0; j < rows; j++) for (let p = 0; p < panes; p++) pushLine(p, Math.random() < 0.15 ? '' : pick()[0], 0);
      buildMask(performance.now()); draw();
    }, 150);
  });

  // ---- notifications ----
  let ev = 0, countdown = 0;
  const cellOf = (el: Element) => {
    const a = el.getBoundingClientRect(), b = cv.getBoundingClientRect();
    return { x: (a.left + a.width / 2 - b.left) / cw, y: (a.top + a.height / 2 - b.top) / ch };
  };
  const head = '<div class="n-top"><i></i><span>Falconer · tu-pc · ahora</span><span class="lock">🔒 E2E</span></div>';

  function show() {
    const e = EVENTS[ev % EVENTS.length];
    clearInterval(countdown);
    if (e.kind === 'ask') {
      notif!.innerHTML = `${head}<div class="n-title">${esc(e.agent)} pide permiso <span>· ${esc(e.proj)}</span></div>` +
        `<code class="n-cmd">${esc(e.cmd)}</code>` +
        '<div class="swipe" data-swipe><div class="fill"></div><div class="label"><span>Deslizá para aprobar</span></div>' +
        '<button class="knob" type="button" data-knob aria-label="Aprobar: deslizá o apretá Enter">→</button></div>' +
        '<div class="n-row"><button type="button" data-deny>Rechazar</button><small data-exp>vence en 15:00</small></div>';
      wireSwipe(e);
      let left = 900;
      countdown = window.setInterval(() => {
        left--;
        const x = notif!.querySelector('[data-exp]');
        if (x) x.textContent = `vence en ${formatCountdown(left)}`;
      }, 1000);
    } else {
      notif!.innerHTML = `${head}<div class="n-title">${esc(e.agent)} terminó <span>· ${esc(e.proj)}</span></div><p class="n-body">${esc(e.body)}</p>`;
      pushLine(e.pane, `✓ ${e.body}`, 1);
      setTimeout(hide, 3400);
    }
    notif!.classList.add('show');
  }
  function hide() { clearInterval(countdown); notif!.classList.remove('show'); ev++; setTimeout(show, 2800); }

  function resolve(e: Ask, ok: boolean, el: Element) {
    clearInterval(countdown);
    const p = cellOf(el), now = performance.now();
    pulses.push({ x: p.x, y: p.y, t: now, v: ok ? 1 : 0.4 });
    if (ok) { flash = 18; bounce = { t0: now, dur: 520, amp: 0.1 }; e.ok.forEach((t, i) => pushLine(e.pane, t, i === 0 ? 1 : 0)); }
    else { bounce = { t0: now, dur: 900, amp: -0.5 }; pushLine(e.pane, '✗ Rechazado desde el teléfono', 1); }
    notif!.innerHTML = `<div class="n-done ${ok ? 'ok' : 'no'}">${ok ? `✓ Aprobado. ${esc(e.agent)} siguió.` : `✗ Rechazado. ${esc(e.agent)} no lo hizo.`}</div>`;
    if (reduce) { buildMask(now); draw(); }
    setTimeout(hide, 2000);
  }

  function wireSwipe(e: Ask) {
    const track = notif!.querySelector<HTMLElement>('[data-swipe]')!;
    const knob = notif!.querySelector<HTMLButtonElement>('[data-knob]')!;
    const fill = track.querySelector<HTMLElement>('.fill')!;
    let startX = 0, dx = 0, dragging = false, done = false;
    const max = () => track.clientWidth - knob.offsetWidth - 10;
    const set = (x: number) => { dx = Math.max(0, Math.min(max(), x)); knob.style.transform = `translateX(${dx}px)`; fill.style.width = `${dx + knob.offsetWidth}px`; };
    const approve = () => { if (done) return; done = true; set(max()); resolve(e, true, knob); };
    knob.addEventListener('pointerdown', (p) => { dragging = true; startX = p.clientX - dx; knob.setPointerCapture(p.pointerId); knob.style.transition = 'none'; fill.style.transition = 'none'; });
    knob.addEventListener('pointermove', (p) => { if (dragging) set(p.clientX - startX); });
    const end = () => {
      if (!dragging) return; dragging = false;
      if (dx > max() * 0.82) approve();
      else { knob.style.transition = 'transform .3s cubic-bezier(.2,1.4,.4,1)'; fill.style.transition = 'width .3s'; set(0); }
    };
    knob.addEventListener('pointerup', end); knob.addEventListener('pointercancel', end);
    knob.addEventListener('keydown', (k) => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); approve(); } });
    notif!.querySelector('[data-deny]')!.addEventListener('click', (c) => { if (done) return; done = true; resolve(e, false, c.currentTarget as Element); });
  }

  // ---- headline decode ----
  function decode(el: HTMLElement, delay: number) {
    const final = el.dataset.text ?? el.textContent ?? '';
    const t0 = performance.now() + delay, G = 'ABCDEGHKMNOPRSTUVXZ';
    const step = (now: number) => {
      const p = (now - t0) / 520;
      let s = '';
      for (let i = 0; i < final.length; i++) {
        const c = final[i];
        s += c === ' ' || c === '.' || c === ',' || p * final.length > i ? c : G[(Math.random() * G.length) | 0];
      }
      el.textContent = s;
      if (p < 1) requestAnimationFrame(step); else el.textContent = final;
    };
    requestAnimationFrame(step);
  }

  function bootSequence(done: () => void) {
    let i = 0;
    const steps = Math.max(10, rows - 6);
    const iv = window.setInterval(() => {
      const l = i < BOOT.length ? BOOT[i] : pick();
      pushLine(0, l[0], l[1]);
      for (let p = 1; p < panes; p++) pushLine(p, Math.random() < 0.15 ? '' : pick()[0], 0);
      if (++i >= steps) { clearInterval(iv); done(); }
    }, reduce ? 0 : 30);
  }

  function start() {
    layout(); buildMask(performance.now()); draw(); setRun();
    if (!reduce) hero.querySelectorAll<HTMLElement>('[data-decode]').forEach((el, n) => decode(el, 150 + n * 300));
    bootSequence(() => {
      riseT0 = performance.now();
      [900, 1300, 1700].forEach((ms, p) => setInterval(() => { if (p < panes && running) pushLine(p, Math.random() < 0.15 ? '' : pick()[0], 0); }, ms));
      setInterval(() => { blink++; }, 530);
      if (reduce) { buildMask(riseT0); draw(); }
      setTimeout(show, reduce ? 300 : 1500);
    });
  }
  const fonts = document.fonts;
  if (fonts?.load) fonts.load('13px "JetBrains Mono"').then(start, start); else start();
}
