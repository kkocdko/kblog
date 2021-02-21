/**
 * Very Easy Page Solution
 */
"use strict";

const inWindow = async () => {
  const cfg = __VEPS_CFG__;

  // Page Load Animation
  {
    
  }

  // Manifest and Icon
  {
    const strToUrl = (str, type) =>
      URL.createObjectURL(new Blob([str], { type }));
    const icon = {};
    {
      const [viewBox, content] = cfg.icon.split(" | ");
      const [startX, startY, endX, endY] = viewBox.split(" ");
      const width = endX - startX;
      const height = endY - startY;
      const full = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
          <path fill="${cfg.themeColor}" d="M0 0h${height}v${width}H0z"/>
          <g fill="#fff">${content}</g>
        </svg>
      `;
      icon.url = "data:image/svg+xml," + encodeURIComponent(full);
    }
    const url = location.origin + location.pathname;
    const manifest = {
      name: cfg.name,
      short_name: cfg.name,
      description: cfg.description,
      start_url: url,
      display: "standalone",
      background_color: cfg.background,
      theme_color: cfg.themeColor,
      icons: [
        {
          src: icon.url,
          type: "image/svg+xml",
          // sizes: "1000x1000",
          sizes: "150x150",
          purpose: "any maskable",
        },
      ],
    };
    const insert = `
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <meta name="theme-color" content="${cfg.themeColor}">
      <title>${cfg.name}</title>
      <link rel="icon" href="${icon.url}">
      <link rel="manifest" href="${strToUrl(JSON.stringify(manifest))}">
    `;
    document.head.insertAdjacentHTML("beforeend", insert);
  }

  // ServiceWorker and Cache
  {
    const url = document.querySelector("[veps-main]").src;
    const reg = await navigator.serviceWorker.register(url);
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (reg.active) resolve(clearInterval(timer));
      }, 100);
    });
    const sw = reg.active;
    const deps = [...document.querySelectorAll("veps-deps>*")];
    const cacheName = document.baseURI.replace(/\/$/, "").replace(/.+\//, "");
    sw.postMessage({
      type: "init",
      data: {
        cache: {
          name: cacheName,
          ver: cfg.ver,
          list: [location.href, url, ...deps.map((el) => el.src || el.href)],
          hotList: [location.href, url],
        },
      },
    });
  }
};

const inServiceWorker = () => {
  onmessage = async ({ data: { type, data } }) => {
    if (type !== "init") throw "unknown msg type";
    const selector = (name) => name.startsWith(data.cache.name);
    const originName = [...(await caches.keys())].find(selector);
    const name = data.cache.name + " - " + data.cache.ver;
    const cache = await caches.open(name);
    const addToCache = (list) =>
      list.map((url) => cache.add(new Request(url, { mode: "cors" })));
    addToCache(data.cache.hotList);
    if (name === originName) return;
    caches.delete(originName);
    addToCache(data.cache.list);
  };
  const inFetch = async (req) => (await caches.match(req)) || fetch(req);
  onfetch = (e) => e.respondWith(inFetch(e.request));
};

switch (constructor.name) {
  case "Window":
    inWindow();
    break;
  case "ServiceWorkerGlobalScope":
    inServiceWorker();
    break;
}
