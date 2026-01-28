const CACHE_NAME = 'news-pwa-v4';
const RUNTIME_CACHE = 'news-pwa-runtime-v1';

// 静的ファイルのみキャッシュ
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script_v2.js'
];

// // 必要ファイルをキャッシュして新SWを即有効化する初期セットアップ
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
    await self.skipWaiting(); // 新SWを即採用
  })());
});

// 新しいSWが有効化されたら、古いキャッシュを全部消してクリーンな状態にする
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key !== CACHE_NAME && key !== RUNTIME_CACHE)
      .map(key => caches.delete(key))
    );
    await self.clients.claim(); // 既存タブも新SWの制御下に入れる
  })());
});

// fetchイベント：summary_v2.json だけ network-first
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;   // POST / PUT / DELETE / PATCH はキャッシュしない

  const url = new URL(event.request.url);

  // 1) ニュースJSON：常に “ネットから” （HTTPキャッシュも使わない）
  if (url.pathname.endsWith('/summary_v2.json') || url.pathname.includes('/summary_v2.json')) {
    event.respondWith((async () => {
      const runtime = await caches.open(RUNTIME_CACHE);

      try {
        // cache:'no-store' で HTTPキャッシュを確実に回避
        const req = new Request(event.request, { cache: 'no-store' });
        const fresh = await fetch(req);

        // オフライン保険：取れたら保存（次に落ちた時だけ使う）
        runtime.put(event.request, fresh.clone());
        return fresh;
      } catch (e) {
        // オフライン時は最後に取得したキャッシュを返す
        const cached = await runtime.match(event.request);
        if (cached) return cached;
        throw e;
      }
    })());
    return;
  }

  // 2) その他：静的ファイルは cache-first
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    return cached || fetch(event.request);
  })());
});
