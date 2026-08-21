// sw.js
const CACHE_NAME = 'naiwa-video-cache-v1';

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
  const request = event.request;
  const url = new URL(request.url);

  // 只处理视频标签的请求，且忽略 Range 请求（让浏览器直接请求网络，不缓存）
  if (request.destination === 'video' && !request.headers.has('range')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          // 只缓存成功且状态为 200 的响应
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
  // 其他请求（包括 fetch()、Range 请求、非视频文件）不拦截，走正常网络
});