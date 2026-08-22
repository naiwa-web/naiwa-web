const CACHE_NAME = 'naiwa-video-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.mp4') && event.request.destination === 'video') {
    // 如果请求包含 Range 头，直接走网络，不缓存（保证播放流畅）
    if (event.request.headers.has('range')) {
      return; // 不拦截，让浏览器正常请求
    }
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          console.log('✅ 命中缓存:', url.href);
          return cached;
        }
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});