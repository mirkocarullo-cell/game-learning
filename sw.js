// Service Worker per Game Learning PWA
// Abilita funzionamento offline e caching

const CACHE_NAME = 'game-learning-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
];

// Install Event - Caching dei file critici
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache install error:', error);
      })
  );
  
  // Force il nuovo service worker a diventare attivo subito
  self.skipWaiting();
});

// Activate Event - Pulizia vecchie cache
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Prendi il controllo di tutte le pagine subito
  self.clients.claim();
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    // Prova la rete prima
    fetch(event.request)
      .then(response => {
        // Se successo, aggiorna la cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se la rete fallisce, prova la cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Se niente in cache, ritorna una pagina offline
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // Ritorna una risposta vuota come fallback
            return new Response('Network request failed and cache not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Message Handler - Comunicazione con il client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(event.data.urls).catch(error => {
          console.error('Error caching URLs:', error);
        });
      })
    );
  }
});

// Background Sync (optional - per future updates)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

async function syncScores() {
  try {
    // Placeholder per sincronizzazione punteggi al backend
    // Implementare quando backend è pronto
    console.log('Syncing scores with backend...');
  } catch (error) {
    console.error('Score sync failed:', error);
  }
}
