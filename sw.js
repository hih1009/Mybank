// 금융정보 관리 시스템 - Service Worker
// 앱 셸(HTML/아이콘/매니페스트)만 캐싱해서 오프라인에서도 앱이 열리도록 함.
// GitHub API 등 외부 데이터 요청은 캐싱하지 않고 그대로 네트워크로 통과시킴.

const CACHE_NAME = 'fin-manager-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 같은 출처(origin) 요청만 캐시 대상으로 처리.
  // GitHub API 등 다른 출처 요청은 건드리지 않고 브라우저 기본 동작에 맡김.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return res;
        })
        .catch(() => cached); // 오프라인이면 캐시로 폴백

      // 캐시가 있으면 즉시 반환(빠른 로딩), 백그라운드로 최신본 갱신
      return cached || networkFetch;
    })
  );
});
