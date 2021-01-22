/**
 * Very Easy Page Solution
 */
"use strict";

const isWindow = async () => {
  const cfg = __VEPS_CFG__;

  const strToUrl = (str, type) =>
    URL.createObjectURL(new Blob([str], { type }));
  const [iconHeight, iconWidth, iconContent] = cfg.icon.split(" | ");
  const iconStr = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <path fill="${cfg.themeColor}" d="M0 0h${iconHeight}v${iconWidth}H0z"/>
      <g fill="#fff">${iconContent}</g>
    </svg>
  `;
  const pageUrl = location.origin + location.pathname;
  // const iconUrl = strToUrl(iconStr, "image/svg+xml");
  const iconUrl =
    "data:image/svg+xml," + iconStr.replaceAll("#", "%23").replaceAll('"', "'");
  const manifest = {
    name: cfg.name,
    short_name: cfg.name,
    description: cfg.description,
    // start_url: "./",
    start_url: pageUrl,
    display: "standalone",
    background_color: cfg.background,
    theme_color: cfg.themeColor,
    icons: [
      {
        src: iconUrl,
        type: "image/svg+xml",
        // sizes: "1000x1000",
        sizes: "150x150",
        purpose: "any maskable",
      },
    ],
  };
  const headInsert = `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta name="theme-color" content="${cfg.themeColor}">
    <title>${cfg.name}</title>
    <link rel="icon" href="${iconUrl}">
    <link rel="manifest" href="${strToUrl(JSON.stringify(manifest))}">
  `;
  document.head.insertAdjacentHTML("beforeend", headInsert);

  const swUrl = document.querySelector("[veps-main]").src;
  const reg = await navigator.serviceWorker.register(swUrl);
  await new Promise((resolve) => {
    const timer = setInterval(() => {
      if (!reg.active) return;
      clearInterval(timer);
      resolve();
    }, 50);
  });
  const sw = reg.active;
  const deps = [...document.querySelectorAll("veps-deps>*")];
  sw.postMessage({
    type: "init",
    data: {
      cache: {
        name: cfg.name,
        ver: cfg.ver,
        list: [location.href, swUrl, ...deps.map((el) => el.src || el.href)],
        activeList: [location.href, swUrl],
      },
    },
  });
};

const isServiceWorker = () => {
  const msgListeners = {};
  onmessage = async ({ data: { type, data } }) => {
    const listener = msgListeners[type];
    if (listener) listener(data);
  };
  msgListeners["init"] = async (data) => {
    const isSameName = (name) => name.startsWith(data.cache.name);
    const originName = [...(await caches.keys())].find(isSameName);
    const name = data.cache.name + " - " + data.cache.ver;
    const cache = await caches.open(name);
    const addToCache = (list) =>
      list.map((url) => cache.add(new Request(url, { mode: "cors" })));
    addToCache(data.cache.activeList);
    if (originName && data.cache.ver === originName.split(" - ")[1]) return;
    caches.delete(originName);
    addToCache(data.cache.list);
  };

  const inFetch = async (req) => (await caches.match(req)) || fetch(req);
  onfetch = (e) => e.respondWith(inFetch(e.request));
  // onactivate = () => {};
};

switch (constructor.name) {
  case "Window":
    isWindow();
    break;
  case "ServiceWorkerGlobalScope":
    isServiceWorker();
    break;
}
