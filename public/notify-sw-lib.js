// Pure helpers shared by notify-sw.js (loaded with importScripts) and the unit tests.
(function (root) {
  var FALLBACK_TITLE = 'Falconer';

  /** Parses a decrypted push payload. Never throws; always yields something showable. */
  function parsePush(text) {
    var out = { kind: 'generic', title: FALLBACK_TITLE, body: '', url: '' };
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (typeof text === 'string' && text.trim()) out.body = text.trim().slice(0, 200);
      return out;
    }
    if (!data || typeof data !== 'object') return out;
    if (typeof data.kind === 'string' && data.kind) out.kind = data.kind;
    if (typeof data.title === 'string' && data.title.trim()) out.title = data.title;
    if (typeof data.body === 'string') out.body = data.body;
    if (typeof data.url === 'string') out.url = data.url;
    return out;
  }

  /** Same-origin page that bounces into the custom scheme (SWs cannot open it directly). */
  function openPath(url) {
    return '/notify/open/?to=' + encodeURIComponent(url || 'openmosh:///inbox');
  }

  root.OpenMoshPush = { parsePush: parsePush, openPath: openPath, FALLBACK_TITLE: FALLBACK_TITLE };
})(self);
