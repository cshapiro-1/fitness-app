// STRKYR Service Worker - Offline Resilience & Asset Caching
const CACHE_NAME = "strkyr-v2";
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

  const url = new URL(event.request.url);

  // Strictly bypass Service Worker for cross-origin requests (e.g. Google avatars, Google CDN, Stripe)
  // Let the browser fetch and render these natively
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache dynamic API routes or NextAuth authentication endpoints
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/stripe") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and store fresh response in cache only for same-origin basic responses
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
