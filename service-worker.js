// Ref: https://developers.google.com/web/fundamentals/codelabs/your-first-pwapp

/* With the service worker registered, the first time a user hits the page an install event is triggered. 
This event is where you want to cache your page assets. */
const CACHE_NAME = "cache01";

const FILES_TO_CACHE = [
    '/index.html'
];

self.addEventListener('install',(e)=>{
    console.log('[ServiceWorker] install');
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          console.log('[ServiceWorker] Pre-caching offline page');
          /*cache.addAll() will reject if any of the individual requests fail. That means you're guaranteed that, if the install step succeeds, you cache will be in a consistent state. 
          But, if it fails for some reason, it will automatically try again the next time the service worker starts up. */
          return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate',(e) =>{
    console.log('[ServiceWorker] activate');
    e.waitUntil(
        caches.keys().then((keyList) => {
          return Promise.all(keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache', key);
              return caches.delete(key);
            }
          }));
        })
    );
});

/*The updated service worker takes control immediately because our install 
event finishes with self.skipWaiting(), and the activate event finishes with self.clients.claim(). 
Without those, the old service worker would continue to control 
the page as long as there is a tab open to the page.*/

self.addEventListener('fetch', (e) => {
    //NETWORK FIRST THEN CACHE STRATEGY
    console.log('[ServiceWorker] fetch '+ e.request.url);
    if (e.request.mode !== 'navigate') {
        // Not a page navigation, bail.
        return;
    }
    e.respondWith(
        fetch(e.request)
            .catch(() => {
            return caches.open(CACHE_NAME)
                .then((cache) => {
                    return cache.match('/index.html');
                });
            })
    );
});

/* The fetch handler only needs to handle page navigations,
so other requests can be dumped out of the handler and will be dealt with normally by the browser. 
But, if the request .mode is navigate, use fetch to try to get the item from the network. 
If it fails, the catch handler opens the cache with caches.open(CACHE_NAME) 
and uses cache.match('offline.html') to get the precached offline page. 
The result is then passed back to the browser using evt.respondWith(). 

Wrapping the fetch call in evt.respondWith() prevents the browsers default fetch 
handling and tells the browser we want to handle the response ourselves. 
If you don't call evt.respondWith() inside of a fetch handler, 
you'll just get the default network behavior. */