const CACHE_NAME = 'news-pwa-cache-v1';

const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './news.json',
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

// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       return response || fetch(event.request);
//     })
//   );
// });

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // オンライン成功 → キャッシュ更新
        const clone = response.clone();
        caches.open('news-cache-v2').then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // オフライン時 → キャッシュから取得
        return caches.match(event.request);
      })
  );
});
