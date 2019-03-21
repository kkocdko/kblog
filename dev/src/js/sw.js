'use strict';

let cacheStorageKey = location.href;

self.addEventListener('fetch', event => {
    caches.match(event.request).then(response => {
        if (response) {
            console.log('Using cache for: ', event.request.url);
            return response;
        } else {
            console.log('Fallback to fetch: ', event.request.url);
            caches.open(cacheStorageKey).then(cache => cache.add(event.request.url));
            return fetch(event.request.url);
        }
    })
});
