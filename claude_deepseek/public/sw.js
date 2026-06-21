// Service Worker disabled
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", () => {
  self.clients.claim();
  // Unregister all old service workers
  self.registration.unregister();
});
self.addEventListener("fetch", (event) => {
  // Don't cache anything, just pass through
  event.respondWith(fetch(event.request));
});
