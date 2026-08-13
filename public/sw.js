// FitCoach Service Worker - Offline Resilience & Asset Caching
const CACHE_NAME = "fitcoach-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/favicon.ico",
  "/privacy",
  "/terms",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Never cache NextAuth or dynamic API mutation routes
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/api/stripe")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and store fresh response in cache
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        // Return cached offline fallback
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return caches.match("/dashboard");
      })
  );
});
