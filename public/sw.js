// 행운로또 PWA 서비스워커 — 앱 셸 오프라인 캐시 (network-first)
const CACHE = "lotto-v2";
const FALLBACK = "/lottery";
const PRECACHE = [
  "/lottery",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 동일 출처만 처리 — 동행복권 등 외부 API는 그대로 통과시킨다
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    (async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, net.clone());
        return net;
      } catch {
        const cached = await caches.match(req);
        return cached || (await caches.match(FALLBACK)) || Response.error();
      }
    })()
  );
});
