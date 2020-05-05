"use strict";

const cacheName = "imgconverter";
const filesList = [
  {
    url: "./",
    updateDate: 1588525108016,
  },
  {
    url:
      "//cdn.jsdelivr.net/npm/material-components-web@6.0.0/dist/material-components-web.min.css",
    updateDate: 1588525108016,
  },
  {
    url: "../misc/material-components-web-kmod.css",
    updateDate: 1588525108016,
  },
  {
    url:
      "//cdn.jsdelivr.net/npm/material-components-web@6.0.0/dist/material-components-web.min.js",
    updateDate: 1588525108016,
  },
  {
    url: "manifest.json",
    updateDate: 1588525108016,
  },
  {
    url: "favicon.svg",
    updateDate: 1588525108016,
  },
];

addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      const cachedFilesList = (await cache.matchAll()).map(
        ({ url, headers }) => ({
          url,
          updateDate: new Date(headers.get("date")).getTime(),
        })
      );
      const fullFilesList = filesList.map(({ url, updateDate }) => ({
        url: new Request(url).url,
        updateDate,
      }));
      const updateFilesList = fullFilesList.filter(
        (file) =>
          !cachedFilesList.find(
            ({ url, updateDate }) =>
              url === file.url && updateDate > file.updateDate
          )
      );
      const deleteFilesList = cachedFilesList.filter(
        (file) => !fullFilesList.find(({ url }) => url === file.url)
      );
      await Promise.all([
        ...updateFilesList.map(({ url }) =>
          cache
            .add(new Request(url, { mode: "cors" }))
            .catch((e) => console.warn(e))
        ),
        ...deleteFilesList.map(({ url }) => cache.delete(url)),
      ]);
    })()
  );
});

addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName);
      const request = event.request;
      return (await cache.match(request)) || (await fetch(request));
    })()
  );
});
