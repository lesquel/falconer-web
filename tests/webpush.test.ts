import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  b64urlDecode, b64urlEncode, buildBlob, buildRegistration, handoffLink, isAllowedTarget, targetFromSearch,
} from '../src/scripts/webpush';

const fill = (n: number, v: number) => new Uint8Array(n).fill(v);
const input = {
  endpoint: 'https://push.example/abc',
  p256dh: fill(65, 4), auth: fill(16, 1), vapidPub: fill(65, 4), vapidPriv: fill(32, 9),
  origin: 'https://openmosh.dev',
};

describe('base64url', () => {
  it('round-trips arbitrary bytes without padding or +/', () => {
    const bytes = Uint8Array.from([251, 255, 254, 0, 1, 2, 3]);
    const enc = b64urlEncode(bytes);
    expect(enc).not.toMatch(/[+/=]/);
    expect(Array.from(b64urlDecode(enc))).toEqual(Array.from(bytes));
  });
  it('encodes known vectors', () => {
    expect(b64urlEncode(new TextEncoder().encode('hi?>'))).toBe('aGk_Pg');
    expect(b64urlEncode(new Uint8Array())).toBe('');
  });
});

describe('registration blob', () => {
  it('has exactly the contract fields and sizes', () => {
    const reg = buildRegistration(input);
    expect(Object.keys(reg)).toEqual(['v', 'endpoint', 'p256dh', 'auth', 'vapid_pub', 'vapid_priv', 'sub']);
    expect(reg.v).toBe(1);
    expect(b64urlDecode(reg.p256dh)).toHaveLength(65);
    expect(b64urlDecode(reg.auth)).toHaveLength(16);
    expect(b64urlDecode(reg.vapid_pub)).toHaveLength(65);
    expect(b64urlDecode(reg.vapid_priv)).toHaveLength(32);
    expect(reg.sub).toBe('https://openmosh.dev');
  });
  it('is base64url of the UTF-8 JSON', () => {
    const blob = buildBlob(input);
    expect(blob).not.toMatch(/[+/=]/);
    expect(JSON.parse(new TextDecoder().decode(b64urlDecode(blob)))).toEqual(buildRegistration(input));
    expect(handoffLink(blob)).toBe(`openmosh:///webpush?d=${blob}`);
  });
  it('rejects wrong key sizes', () => {
    expect(() => buildBlob({ ...input, auth: fill(15, 1) })).toThrow(/auth/);
    expect(() => buildBlob({ ...input, vapidPriv: fill(31, 1) })).toThrow(/vapid_priv/);
  });
});

describe('open page allow-list', () => {
  it('only allows openmosh:/// targets', () => {
    expect(isAllowedTarget('openmosh:///inbox')).toBe(true);
    for (const bad of ['https://evil.dev', 'javascript:alert(1)', 'openmosh://host/x', 'openmosh:/inbox', '', null, undefined]) {
      expect(isAllowedTarget(bad as string)).toBe(false);
    }
  });
  it('reads and decodes ?to=', () => {
    expect(targetFromSearch('?to=' + encodeURIComponent('openmosh:///inbox?x=1'))).toBe('openmosh:///inbox?x=1');
    expect(targetFromSearch('?to=javascript:1')).toBeNull();
    expect(targetFromSearch('')).toBeNull();
  });
});

describe('service worker helpers', () => {
  const scope: { OpenMoshPush?: any } = {};
  new Function('self', readFileSync('public/notify-sw-lib.js', 'utf8'))(scope);
  const { parsePush, openPath } = scope.OpenMoshPush;

  it('parses the push contract', () => {
    const p = parsePush(JSON.stringify({ v: 1, kind: 'approval', title: 'T', body: 'B', url: 'openmosh:///inbox' }));
    expect(p).toEqual({ kind: 'approval', title: 'T', body: 'B', url: 'openmosh:///inbox' });
  });
  it('falls back to a showable notification on bad payloads', () => {
    expect(parsePush('not json').title).toBe('Falconer');
    expect(parsePush('').title).toBe('Falconer');
    expect(parsePush('null').title).toBe('Falconer');
    expect(parsePush('{"title":42}').title).toBe('Falconer');
  });
  it('builds the open-page path', () => {
    expect(openPath('openmosh:///inbox')).toBe('/notify/open/?to=openmosh%3A%2F%2F%2Finbox');
    expect(openPath('')).toContain(encodeURIComponent('openmosh:///inbox'));
  });
});
