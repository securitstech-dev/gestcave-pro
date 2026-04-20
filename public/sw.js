const CACHE_NAME = 'gestcave-pro-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icons.svg',
  '/logo_gestcave.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes vers Firebase (gérées par Firestore SDK)
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebaseinstallations.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Ne mettre en cache que les ressources statiques locales
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Fallback si rien ne fonctionne
      return caches.match('/');
    })
  );
});
