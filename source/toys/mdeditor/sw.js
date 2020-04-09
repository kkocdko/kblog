"use strict";

const cacheName = "mdeditor";
const filesList = [
  {
    url: "./",
    updateDate: 1585193258101,
  },
  {
    url: "//cdn.jsdelivr.net/gh/kkocdko/gfmstyle@1.0.1/dist/gfmstyle.min.css",
    updateDate: 1585193258101,
  },
  {
    url: "//cdn.jsdelivr.net/npm/marked@0.2.10/lib/marked.min.js",
    updateDate: 1585193258101,
  },
  {
    url: "style.css",
    updateDate: 1585193258101,
  },
  {
    url: "script.js",
    updateDate: 1585193258101,
  },
  {
    url: "favicon.svg",
    updateDate: 1585193258101,
  },
  {
    url: "favicon.png",
    updateDate: 1585193258101,
  },
  {
    url: "manifest.json",
    updateDate: 1585193258101,
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
