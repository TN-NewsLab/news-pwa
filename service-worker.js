const CACHE_NAME = 'news-pwa-v3';

// 静的ファイルのみキャッシュ（ニュースJSONは絶対にキャッシュしない）
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script_v2.js'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static files');
      return cache.addAll(urlsToCache);
    })
  );
});

// ★ fetchイベント：summary_v2.json だけ network-first
self.addEventListener('fetch', (event) => {

  // POST / PUT / DELETE / PATCH はキャッシュしない
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // --- 1) ニュースデータは network-first ---
  if (url.includes('summary_v2.json')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => networkResponse)
        .catch(() => caches.match(event.request)) // ネット失敗時のみキャッシュ
    );
    return;
  }

  // --- 2) その他の静的ファイルは cache-first ---
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});
