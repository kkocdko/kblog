"use strict";

const cacheName = "dino";
const filesList = [
  {
    url: "./",
    updateDate: 1585193258101
  },
  {
    url: "//cdn.jsdelivr.net/gh/kkocdko/dino/dist/runner.min.js",
    updateDate: 1585193258101
  },
  {
    url: "favicon.svg",
    updateDate: 1585193258101
  },
  {
    url: "favicon.png",
    updateDate: 1585193258101
  },
  {
    url: "manifest.json",
    updateDate: 1585193258101
  }
];

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await self.caches.open(cacheName);
      const cachedFilesList = (await cache.matchAll()).map(
        ({ url, headers }) => ({
          url,
          updateDate: new Date(headers.get("date")).getTime()
        })
      );
      const fullFilesList = filesList.map(({ url, updateDate }) => ({
        url: new self.Request(url).url,
        updateDate
      }));
      const updateFilesList = fullFilesList.filter(
        file =>
          !cachedFilesList.find(
            ({ url, updateDate }) =>
              url === file.url && updateDate > file.updateDate
          )
      );
      const deleteFilesList = cachedFilesList.filter(
        file => !fullFilesList.find(({ url }) => url === file.url)
      );
      await Promise.all([
        ...updateFilesList.map(({ url }) =>
          cache
            .add(new self.Request(url, { mode: "cors" }))
            .catch(e => console.warn(e))
        ),
        ...deleteFilesList.map(({ url }) => cache.delete(url))
      ]);
    })()
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    (async () => {
      const cache = await self.caches.open(cacheName);
      const request = event.request;
      return (await cache.match(request)) || (await self.fetch(request));
    })()
  );
});
