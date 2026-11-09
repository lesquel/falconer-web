import { pupils, relative, safeAccent, tilt } from './motion';

export type Decision = 'approve' | 'deny';
export interface DemoLine {
  text: string;
  tone: 'ok' | 'no' | 'muted';
}

/** What the demo terminal prints after the user decides. Pure, so it is unit-tested. */
export function approveLines(decision: Decision): DemoLine[] {
  if (decision === 'approve') {
    return [
      { text: '✓ Aprobado desde el teléfono', tone: 'ok' },
      { text: '$ pnpm test --filter api', tone: 'muted' },
      { text: '✓ 42 tests pasaron. El agente sigue.', tone: 'ok' },
    ];
  }
  return [
    { text: '✗ Rechazado desde el teléfono', tone: 'no' },
    { text: '⏺ Entendido, no corro el comando. ¿Qué hago en su lugar?', tone: 'muted' },
  ];
}

/** Accepts only the two known decisions. */
export function parseDecision(value: string | undefined): Decision | null {
  return value === 'approve' || value === 'deny' ? value : null;
}

export const ACCENT_KEY = 'openmosh-accent';

/** Reads the remembered accent; storage can be missing or throw (private mode). */
export function loadAccent(storage: Pick<Storage, 'getItem'> | undefined): string {
  try {
    return safeAccent(storage?.getItem(ACCENT_KEY) ?? undefined);
  } catch {
    return safeAccent(undefined);
  }
}

export function saveAccent(storage: Pick<Storage, 'setItem'> | undefined, hex: string): void {
  try {
    storage?.setItem(ACCENT_KEY, safeAccent(hex));
  } catch {
    /* storage blocked: the choice simply is not remembered */
  }
}

const hasDom = typeof window !== 'undefined' && typeof document !== 'undefined';
const reduceMotion = hasDom && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = hasDom && window.matchMedia('(pointer: fine)').matches;

function initPointerEffects(): void {
  if (reduceMotion) return;
  const root = document.documentElement;
  const phone = document.querySelector<HTMLElement>('[data-tilt]');
  const eyes = document.querySelector<SVGGElement>('[data-mole] [data-pupils]');
  let frame = 0;
  let last = { x: window.innerWidth / 2, y: window.innerHeight / 3 };

  const paint = () => {
    frame = 0;
    root.style.setProperty('--mx', `${last.x}px`);
    root.style.setProperty('--my', `${last.y + window.scrollY}px`);
    if (phone && finePointer) {
      const { dx, dy } = relative(last, phone.getBoundingClientRect());
      const t = tilt(dx, dy);
      phone.style.setProperty('--rx', t.rx);
      phone.style.setProperty('--ry', t.ry);
    }
    if (eyes) {
      const svg = eyes.ownerSVGElement;
      if (svg) {
        const { dx, dy } = relative(last, svg.getBoundingClientRect());
        eyes.setAttribute('transform', pupils(dx, dy));
      }
    }
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      last = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    },
    { passive: true },
  );
}

function initCopy(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
    const state = button.querySelector<HTMLElement>('[data-copy-state]');
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy ?? '');
        if (state) state.textContent = 'copiado ✓';
      } catch {
        const code = button.querySelector('code');
        if (code) window.getSelection()?.selectAllChildren(code);
        if (state) state.textContent = 'seleccionado';
      }
    });
  }
}

function initPressGroup(selector: string, onPick: (button: HTMLButtonElement) => void): void {
  const group = document.querySelector<HTMLElement>(selector);
  if (!group) return;
  const buttons = [...group.querySelectorAll<HTMLButtonElement>('button')];
  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const b of buttons) b.setAttribute('aria-pressed', String(b === button));
      onPick(button);
    });
  }
}

function initTabs(): void {
  const echo = document.querySelector<HTMLElement>('[data-tab-echo]');
  initPressGroup('[data-tabs]', (b) => {
    if (echo) echo.textContent = b.dataset.tab ?? '1';
  });
}

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function initAccents(): void {
  const apply = (hex: string) => {
    document.documentElement.style.setProperty('--accent', hex);
    for (const b of document.querySelectorAll<HTMLButtonElement>('[data-accents] button')) {
      b.setAttribute('aria-pressed', String(safeAccent(b.dataset.accent) === hex));
    }
  };
  apply(loadAccent(storage()));
  initPressGroup('[data-accents]', (b) => {
    const hex = safeAccent(b.dataset.accent);
    apply(hex);
    saveAccent(storage(), hex);
  });
}

function initApproveDemo(): void {
  const root = document.querySelector<HTMLElement>('[data-approve-demo]');
  if (!root) return;
  const log = root.querySelector<HTMLElement>('[data-approve-log]');
  const actions = root.querySelector<HTMLElement>('[data-approve-actions]');
  const reset = root.querySelector<HTMLButtonElement>('[data-approve-reset]');
  if (!log || !actions || !reset) return;
  const initial = log.innerHTML;

  for (const button of actions.querySelectorAll<HTMLButtonElement>('button[data-decision]')) {
    button.addEventListener('click', () => {
      const decision = parseDecision(button.dataset.decision);
      if (!decision) return;
      for (const line of approveLines(decision)) {
        const p = document.createElement('p');
        p.className = line.tone;
        p.textContent = line.text;
        log.append(p);
      }
      actions.hidden = true;
      reset.hidden = false;
      reset.focus();
    });
  }
  reset.addEventListener('click', () => {
    log.innerHTML = initial;
    actions.hidden = false;
    reset.hidden = true;
    actions.querySelector<HTMLButtonElement>('button')?.focus();
  });
}

if (hasDom) {
  initPointerEffects();
  initCopy();
  initTabs();
  initAccents();
  initApproveDemo();
}
