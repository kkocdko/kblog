/**
 * Very Easy Page Solution v4.0.2
 *
 * Single file as both loader and service worker.
 */
"use strict";

const inWindow = async () => {
  // yields(await) may cause unexpected behaviours, be careful
  const vepsTag = document.currentScript;
  if (location.href.endsWith("/")) location.href = location.href.slice(0, -1);
  const manifest = {
    start_url: location.href,
    name: document.title.split(" - ")[0],
    description: document.title.split(" - ")[1] || "",
    display: "standalone",
    icons: [{ type: "image/png", sizes: "200x200", purpose: "any maskable" }],
  };
  {
    const lcg = (cur) => (25214903917 * cur) & 65535; // lcg random generator
    // const lcg = (cur) => (1103515245 * lcgSeed + 12345) % 2147483648;
    const text = manifest.name.replace(" ", "").toUpperCase();
    let sum = 0;
    for (let i = text.length; i--; ) sum = lcg(sum) + 13 * text.charCodeAt(i);
    const hueRaw = sum % (360 - (160 - 60)); // exclude ugly color area: 60 - 160
    const hue = hueRaw < 60 ? hueRaw : hueRaw + 160;
    const chars = [];
    for (let i = 0, j = 0; i < 4 ** 2; ) {
      chars.push([Math.floor(i / 4), i % 4, text[j]]);
      sum = lcg(sum);
      i += (sum % 3) + 1;
      j = (j + 1) % text.length;
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.height = 200;
    ctx.fillStyle = `hsl(${hue}deg,15%,77%)`;
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = `hsl(${hue}deg,35%,47%)`;
    for (const [i, j] of chars) ctx.fillRect(20 + j * 40, 20 + i * 40, 40, 40);
    ctx.fillStyle = `hsl(${hue}deg,15%,90%)`;
    ctx.font = "30px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const [i, j, c] of chars) ctx.fillText(c, 40 + j * 40, 41 + i * 40);
    manifest.icons[0].src = canvas.toDataURL("image/png");
  }
  const manifestUrl =
    "data:text/json," + encodeURIComponent(JSON.stringify(manifest));
  const headInsert = `
    <link rel="icon" href="${manifest.icons[0].src}">
    <link rel="manifest" href="${manifestUrl}">
  `;
  document.head.insertAdjacentHTML("afterbegin", headInsert);
  if (vepsTag.getAttribute(":version").includes("-")) return; // is testing version
  // no awaits before!
  const reg = await navigator.serviceWorker.register(vepsTag.src);
  await navigator.serviceWorker.ready;
  const sw = reg.active;
  sw.postMessage({
    type: "cache",
    name: manifest.name,
    version: vepsTag.getAttribute(":version"),
    list: [
      location, // has `href` attribute
      ...document.head.querySelectorAll("script[src],link[rel=stylesheet]"),
      ...Object.values(
        JSON.parse(
          document.head.querySelector("script[type=importmap]")?.textContent ||
            '{"imports":{}}'
        )?.imports
      ),
    ].map((v) => v.src || v.href),
    hotList: [location.href], // refetch everytime
  });
};

const inServiceWorker = () => {
  onmessage = async ({ data: msg }) => {
    if (msg.type !== "cache") throw new Error(`unknown msg type [${msg.type}]`);
    const matcher = (v) => v.startsWith(msg.name);
    const originName = (await caches.keys()).find(matcher);
    const currentName = msg.name + " - " + msg.version;
    const cache = await caches.open(currentName);
    const addToCache = (list) =>
      // `cache.addAll` cancel others if any of request failed
      // `cors` has no effects if needless
      cache.addAll(list.map((url) => new Request(url, { mode: "cors" })));
    if (currentName === originName) return addToCache(msg.hotList);
    // app version upgraded, rebuild cache
    caches.delete(originName);
    addToCache(msg.list);
  };
  const inFetch = async (req) => (await caches.match(req)) || fetch(req); // just query all
  onfetch = (e) => e.respondWith(inFetch(e.request)); // remember to use `respondWith`
};

switch (constructor.name) {
  case "Window":
    inWindow();
    break;
  case "ServiceWorkerGlobalScope":
    inServiceWorker();
    break;
}
