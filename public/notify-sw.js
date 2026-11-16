/* Falconer notifications service worker (scope: /notify/). */
importScripts('/notify-sw-lib.js');

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var text = '';
  try {
    text = event.data ? event.data.text() : '';
  } catch (e) {}
  var p = self.OpenMoshPush.parsePush(text);
  // Always show a notification: Safari revokes permission after silent pushes.
  event.waitUntil(
    self.registration.showNotification(p.title, {
      body: p.body,
      tag: 'openmosh-' + p.kind,
      // Same tag replaces the previous one; still alert for each new event.
      renotify: true,
      icon: '/icons/icon-192.png',
      data: { url: p.url },
    }),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '';
  var path = self.OpenMoshPush.openPath(url);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if ('navigate' in c && 'focus' in c) {
          return c.navigate(path).then(function (w) { return w ? w.focus() : undefined; }, function () {
            return self.clients.openWindow(path);
          });
        }
      }
      return self.clients.openWindow(path);
    }),
  );
});
