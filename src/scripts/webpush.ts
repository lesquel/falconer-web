/** Pure helpers for the /notify/ PWA. Unit-tested; no DOM access here. */

export const BLOB_VERSION = 1;
export const ALLOWED_PREFIX = 'openmosh:///';

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(text: string): Uint8Array {
  const pad = '='.repeat((4 - (text.length % 4)) % 4);
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface BlobInput {
  endpoint: string;
  p256dh: Uint8Array; // 65 bytes
  auth: Uint8Array; // 16 bytes
  vapidPub: Uint8Array; // 65 bytes, uncompressed P-256 point
  vapidPriv: Uint8Array; // 32 bytes, scalar d
  origin: string;
}

export interface Registration {
  v: 1;
  endpoint: string;
  p256dh: string;
  auth: string;
  vapid_pub: string;
  vapid_priv: string;
  sub: string;
}

function expectLength(name: string, bytes: Uint8Array, length: number): void {
  if (bytes.length !== length) throw new Error(`${name} must be ${length} bytes, got ${bytes.length}`);
}

/** Registration object handed to OpenMosh; field names and sizes are a cross-repo contract. */
export function buildRegistration(input: BlobInput): Registration {
  expectLength('p256dh', input.p256dh, 65);
  expectLength('auth', input.auth, 16);
  expectLength('vapid_pub', input.vapidPub, 65);
  expectLength('vapid_priv', input.vapidPriv, 32);
  if (!input.endpoint) throw new Error('endpoint is required');
  return {
    v: BLOB_VERSION,
    endpoint: input.endpoint,
    p256dh: b64urlEncode(input.p256dh),
    auth: b64urlEncode(input.auth),
    vapid_pub: b64urlEncode(input.vapidPub),
    vapid_priv: b64urlEncode(input.vapidPriv),
    sub: input.origin,
  };
}

/** base64url (no padding) of the UTF-8 JSON registration. */
export function buildBlob(input: BlobInput): string {
  return b64urlEncode(new TextEncoder().encode(JSON.stringify(buildRegistration(input))));
}

export function handoffLink(blob: string): string {
  return `openmosh:///webpush?d=${blob}`;
}

/** The open page may only bounce into the app's own scheme. */
export function isAllowedTarget(to: string | null | undefined): to is string {
  return typeof to === 'string' && to.startsWith(ALLOWED_PREFIX);
}

/** Pulls the validated `to` target out of a query string, or null. */
export function targetFromSearch(search: string): string | null {
  const to = new URLSearchParams(search).get('to');
  return isAllowedTarget(to) ? to : null;
}
