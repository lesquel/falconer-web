import { b64urlDecode, b64urlEncode, buildBlob } from './webpush';

const DB_NAME = 'openmosh-notify';
const STORE = 'keys';
const KEY_ID = 'vapid';
const SW_URL = '/notify-sw.js';
const SW_SCOPE = '/notify/';

interface StoredKeys {
  pub: string;
  priv: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

async function getOrCreateKeys(): Promise<StoredKeys> {
  const existing = await idb<StoredKeys | undefined>('readonly', (s) => s.get(KEY_ID));
  if (existing) return existing;
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  if (!jwk.d) throw new Error('private key export failed');
  const keys = { pub: b64urlEncode(pub), priv: jwk.d };
  await idb('readwrite', (s) => s.put(keys, KEY_ID));
  return keys;
}

const deleteKeys = () => idb('readwrite', (s) => s.delete(KEY_ID));

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

type View = 'loading' | 'unsupported' | 'install' | 'enable' | 'denied' | 'ready' | 'error';

function show(view: View, message?: string): void {
  document.querySelectorAll<HTMLElement>('[data-view]').forEach((el) => {
    el.hidden = el.dataset.view !== view;
  });
  if (view === 'error') $('error-text').textContent = message ?? 'Something went wrong.';
}

async function subscriptionBlob(sub: PushSubscription, keys: StoredKeys): Promise<string> {
  const p256dh = sub.getKey('p256dh');
  const auth = sub.getKey('auth');
  if (!p256dh || !auth) throw new Error('Subscription is missing its encryption keys.');
  return buildBlob({
    endpoint: sub.endpoint,
    p256dh: new Uint8Array(p256dh),
    auth: new Uint8Array(auth),
    vapidPub: b64urlDecode(keys.pub),
    vapidPriv: b64urlDecode(keys.priv),
    origin: location.origin,
  });
}

/**
 * The code carries this browser's VAPID private key, so it is only copied and pasted into the
 * app by hand. It is never put in a link: the app does not accept codes from links.
 */
function showHandoff(blob: string): void {
  $<HTMLElement>('code-box').dataset.blob = blob;
  show('ready');
}

async function copy(blob: string, button: HTMLButtonElement): Promise<void> {
  const label = button.textContent;
  try {
    await navigator.clipboard.writeText(blob);
    button.textContent = 'Copied';
  } catch {
    const ta = $<HTMLTextAreaElement>('code-fallback');
    ta.hidden = false;
    ta.value = blob;
    ta.select();
    button.textContent = 'Select and copy below';
  }
  setTimeout(() => (button.textContent = label), 2000);
}

async function main(): Promise<void> {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (isIos() && !isStandalone()) return show('install');
  if (!supported) return show('unsupported');

  let reg: ServiceWorkerRegistration;
  let keys: StoredKeys;
  try {
    reg = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
    keys = await getOrCreateKeys();
  } catch (e) {
    return show('error', `Setup failed: ${(e as Error).message}`);
  }

  const existing = await navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription());
  if (existing && Notification.permission === 'granted') {
    try {
      return showHandoff(await subscriptionBlob(existing, keys));
    } catch {
      /* fall through to a fresh enable */
    }
  }
  show(Notification.permission === 'denied' ? 'denied' : 'enable');

  $('enable-btn').addEventListener('click', () => {
    // Permission request goes first, directly in the gesture (iOS requires it).
    Notification.requestPermission().then(async (perm) => {
      if (perm !== 'granted') return show('denied');
      try {
        const ready = await navigator.serviceWorker.ready;
        let sub = await ready.pushManager.getSubscription();
        if (sub) await sub.unsubscribe(); // key may differ from a previous run
        sub = await ready.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64urlDecode(keys.pub) as BufferSource,
        });
        showHandoff(await subscriptionBlob(sub, keys));
      } catch (e) {
        show('error', `Could not subscribe: ${(e as Error).message}`);
      }
    });
  });

  $<HTMLButtonElement>('copy-btn').addEventListener('click', (ev) =>
    copy($('code-box').dataset.blob ?? '', ev.currentTarget as HTMLButtonElement),
  );

  $('reset-btn').addEventListener('click', async () => {
    try {
      const sub = await reg.pushManager.getSubscription();
      await sub?.unsubscribe();
      await deleteKeys();
      keys = await getOrCreateKeys();
      show('enable');
    } catch (e) {
      show('error', `Reset failed: ${(e as Error).message}`);
    }
  });
}

main();
