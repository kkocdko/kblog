/**
 * Very Easy Page Solution v3.1.0
 *
 * Features:
 * 1. Reduce the code of toy pages.
 * 2. Single file as both loader and service worker.
 * 3. Generate icon by app name.
 */
"use strict";

const inWindow = async () => {
  // The yields(await) may cause unexpected behaviours, be careful
  // TODO: add loading animation?
  const vepsTag = document.currentScript;
  const icon = { type: "image/png", sizes: "500x500" };
  {
    const lcg = (current) => (25214903917 * current) & 65535;
    const text = document.baseURI.split("/").slice(-2)[0].toUpperCase();
    let sum = 0;
    for (let i = text.length; i--; ) sum = lcg(sum) + 13 * text.charCodeAt(i);
    const hueRaw = sum % (360 - (160 - 60)); // exclude ugly color area 60-160
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
    canvas.width = canvas.height = 500;
    ctx.fillStyle = `hsl(${hue}deg,15%,70%)`;
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = `hsl(${hue}deg,40%,45%)`;
    for (const [i, j] of chars)
      ctx.fillRect(50 + j * 100, 50 + i * 100, 100, 100);
    ctx.fillStyle = `hsl(${hue}deg,15%,90%)`;
    ctx.font = "80px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const [i, j, c] of chars)
      ctx.fillText(c, 100 + j * 100, 105 + i * 100);
    icon.src = canvas.toDataURL("image/png");
  }
  const manifest = {
    id: document.baseURI,
    start_url: document.baseURI,
    name: vepsTag.getAttribute(":name"),
    short_name: vepsTag.getAttribute(":name"),
    description: vepsTag.getAttribute(":description"),
    display: "standalone",
    icons: [{ ...icon, purpose: "any maskable" }],
  };
  const manifetsUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)]));
  const headInsert = `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <style>/* veps prelude */*{box-sizing:border-box;color:#000;background:#fff}@media(prefers-color-scheme:dark){*{color:#fff;background:#000}}</style>
    <link rel="icon" href="${icon.src}">
    <link rel="manifest" href="${manifetsUrl}">
    <title>${manifest.name}</title>
  `;
  document.head.insertAdjacentHTML("afterbegin", headInsert); // No awaits before!
  const reg = await navigator.serviceWorker.register(vepsTag.src);
  await navigator.serviceWorker.ready;
  const sw = reg.active;
  sw.postMessage({
    type: "cache",
    name: manifest.name,
    version: vepsTag.getAttribute(":version"),
    list: [
      location,
      ...document.head.querySelectorAll("script,[rel=stylesheet]"),
    ].map((v) => v.src || v.href),
    hotList: [location.href], // Refetch everytime
  });
};

const inServiceWorker = () => {
  onmessage = async ({ data: msg }) => {
    if (msg.type !== "cache") throw new Error(`unknown msg type [${msg.type}]`);
    const selector = (name) => name.startsWith(msg.name);
    const originName = [...(await caches.keys())].find(selector);
    const name = msg.name + " - " + msg.version;
    const cache = await caches.open(name);
    const addToCache = (list) =>
      list.forEach((url) => cache.add(new Request(url, { mode: "cors" })));
    if (name === originName) return addToCache(msg.hotList);
    caches.delete(originName);
    addToCache(msg.list);
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
