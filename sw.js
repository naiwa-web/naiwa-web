// 缓存版本，更新视频时修改可强制更新
const CACHE_NAME = 'naiwa-video-cache-v1';
const VIDEO_URL_PATTERN = /\.mp4(\?|$)/; // 匹配所有 mp4 请求

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (VIDEO_URL_PATTERN.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // 命中缓存，直接返回
          return cached;
        }
        // 未命中，发起网络请求并缓存
        return fetch(event.request).then((response) => {
          // 只缓存成功且状态为 200 的响应
          if (!response || response.status !== 200) {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});