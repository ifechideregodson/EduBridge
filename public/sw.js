const CACHE_NAME = "edubridge-shell-v1";
const APP_SHELL = ["/", "/login", "/manifest.json"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/student") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/teacher") || url.pathname.startsWith("/exams/")) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok && (url.pathname === "/" || url.pathname === "/login" || url.pathname === "/manifest.json" || url.pathname.startsWith("/_next/static/"))) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  }).catch(async () => (await caches.match(request)) || (await caches.match("/"))));
});
