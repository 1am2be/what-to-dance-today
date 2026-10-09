const CACHE_NAME = "idol-dance-__BUILD_VERSION__";
const PRECACHE_MANIFEST = "precache-manifest.json";

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch(new URL(PRECACHE_MANIFEST, self.registration.scope), { cache: "no-store" })
      .then((response) => response.json())
      .then(({ files }) => {
        const urls = [PRECACHE_MANIFEST, ...files].map((file) => new URL(file, self.registration.scope).toString());
        return caches.open(CACHE_NAME).then((cache) => cache.addAll(urls));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(new URL("index.html", self.registration.scope).toString())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    }),
  );
});
