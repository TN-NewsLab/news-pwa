const CACHE_NAME = 'news-pwa-cache-v2';

const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script_v2.js',
  // './data/news.json',
  './data/summary_v2.json',
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching Files');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {

  // POST / PUT / DELETE / PATCH はキャッシュ禁止
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open('news-cache-v2').then(cache => {
      return cache.match(event.request).then(cached => {

        // 常にネットワークを優先
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // 成功したらキャッシュ更新
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // ネットワーク失敗 → キャッシュへ
            return cached;
          });

        return cached || fetchPromise;
      });
    })
  );
});
