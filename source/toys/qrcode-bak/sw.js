"use strict";

const cacheName = "qrcode";
const filesList = [
  {
    url: "./",
    updateDate: 1586884042956,
  },
  {
    url:
      "//cdn.jsdelivr.net/npm/material-components-web@5.1.0/dist/material-components-web.min.css",
    updateDate: 1586884042956,
  },
  {
    url:
      "//cdn.jsdelivr.net/npm/material-components-web@5.1.0/dist/material-components-web.min.js",
    updateDate: 1586884042956,
  },
  {
    url: "../misc/material-components-web-kmod.css",
    updateDate: 1586884042956,
  },
  {
    url: "style.css",
    updateDate: 1586884042956,
  },
  {
    url: "qrcode.js",
    updateDate: 1586884042956,
  },
  {
    url: "script.js",
    updateDate: 1586884042956,
  },
  {
    url: "favicon.svg",
    updateDate: 1586884042956,
  },
  {
    url: "favicon.png",
    updateDate: 1586884042956,
  },
  {
    url: "manifest.json",
    updateDate: 1586884042956,
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
