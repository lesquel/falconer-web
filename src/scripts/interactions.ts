import { pupils, relative, safeAccent, tilt } from './motion';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

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

function initAccents(): void {
  initPressGroup('[data-accents]', (b) => {
    document.documentElement.style.setProperty('--accent', safeAccent(b.dataset.accent));
  });
}

initPointerEffects();
initCopy();
initTabs();
initAccents();
