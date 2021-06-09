/**
 * Very Easy Page Solution
 */
"use strict";

const inWindow = async () => {
  const cfg = __VEPS_CFG__;

  // Page Load Animation
  {
    // TODO
  }

  // Manifest and Icon
  {
    const strToUrl = (str, type) =>
      URL.createObjectURL(new Blob([str], { type }));
    const iconUrl = await new Promise((resolve) => {
      const [viewBox, content] = cfg.icon.split(" | ");
      const [startX, startY, endX, endY] = viewBox.split(" ");
      const width = endX - startX;
      const height = endY - startY;
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
          <path
            fill="${cfg.themeColor}"
            d="M${startX} ${startY}h${height}v${width}H${startX}z"
          />
          <g fill="#fff">${content}</g>
        </svg>
      `;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const img = new Image();
      img.onload = () => {
        canvas.getContext("2d").drawImage(img, 0, 0, 256, 256);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = "data:image/svg+xml," + encodeURIComponent(svg);
      console.log(img.src);
    });
    const pageUrl = location.origin + location.pathname;
    const manifest = {
      name: cfg.name,
      short_name: cfg.name,
      description: cfg.description,
      start_url: pageUrl,
      display: "standalone",
      background_color: cfg.background,
      theme_color: cfg.themeColor,
      icons: [
        {
          src: iconUrl,
          type: "image/png",
          sizes: "256x256",
          purpose: "any maskable",
        },
      ],
    };
    const insert = `
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <meta name="theme-color" content="${cfg.themeColor}">
      <title>${cfg.name}</title>
      <link rel="icon" href="${iconUrl}">
      <link rel="manifest" href="${strToUrl(JSON.stringify(manifest))}">
    `;
    document.head.insertAdjacentHTML("beforeend", insert);
  }

  // ServiceWorker and Cache
  {
    // Don't use document.currentScript in async function
    const vepsUrl = document.querySelector("[veps-main]").src;
    const reg = await navigator.serviceWorker.register(vepsUrl);
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (reg.active) resolve(clearInterval(timer));
      }, 100);
    });
    const sw = reg.active;
    const deps = [...document.querySelectorAll("veps-deps>*")];
    const cacheName = document.baseURI.replace(/\/$/, "").replace(/.+\//, "");
    const initCfg = {
      cache: {
        name: cacheName,
        version: cfg.version,
        list: [location.href, vepsUrl, ...deps.map((el) => el.src || el.href)],
        hotList: [location.href, vepsUrl], // Refetch everytime
      },
    };
    sw.postMessage({ type: "init", data: initCfg });
  }
};

const inServiceWorker = () => {
  onmessage = async ({ data: { type, data } }) => {
    if (type !== "init") throw `unknown msg type [${type}]`;
    const selector = (name) => name.startsWith(data.cache.name);
    const originName = [...(await caches.keys())].find(selector);
    const name = data.cache.name + " - " + data.cache.version;
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
