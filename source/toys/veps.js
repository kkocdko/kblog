/**
 * Very Easy Page Solution v3.0.0
 *
 * PWA, cache control
 * Generate icon from app name
 */
"use strict";

const inWindow = async () => {
  // TODO: add loading animation?
  const vepsTag = document.querySelector('[src="../veps.js"]'); // Don't use document.currentScript in async function
  const strToBlobUrl = (str, type) =>
    URL.createObjectURL(new Blob([str], { type }));
  const icon = { type: "image/png", sizes: "256x256" };
  {
    const lcg = (current) => (25214903917 * current) & 65535;
    const text = document.baseURI.split("/").slice(-2)[0].toUpperCase();
    let sum = 0;
    for (let i = text.length; i--; ) sum = lcg(sum) + 13 * text.charCodeAt(i);
    const hueRaw = sum % (360 - (150 - 55)); // exclude ugly color area 55-150
    const hue = hueRaw < 55 ? hueRaw : hueRaw + 150;
    const chars = [];
    for (let i = 0, j = 0; i < 4 ** 2; ) {
      chars.push([Math.floor(i / 4), i % 4, text[j]]);
      sum = lcg(sum);
      i += (sum % 3) + 1;
      j = (j + 1) % text.length;
    }
    let svg = `<svg style="background:hsl(${hue}deg,15%,65%)" xmlns="http://www.w3.org/2000/svg" viewBox="-5 -5 50 50" width="256" height="256">`;
    for (const [i, j, c] of chars) {
      const [x, y] = [j * 10, i * 10];
      svg += `<rect x="${x}" y="${y}" fill="hsl(${hue}deg,50%,35%)" width="10" height="10"/>`;
      svg += `<text x="${x + 5}" y="${y + 5}" font-size="8" fill="#fff" `;
      svg += `style="dominant-baseline:central;text-anchor:middle">${c}</text>`;
    }
    svg += `</svg>`;
    const img = new Image();
    const imgOnload = new Promise((r) => (img.onload = r));
    img.src = "data:image/svg+xml," + encodeURIComponent(svg);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    await imgOnload;
    canvas.getContext("2d").drawImage(img, 0, 0, 256, 256);
    icon.src = canvas.toDataURL("image/png");
  }
  const manifest = {
    id: document.baseURI,
    start_url: document.baseURI,
    name: vepsTag.getAttribute(":name"),
    short_name: vepsTag.getAttribute(":name"),
    description: vepsTag.getAttribute(":description"),
    display: "standalone",
    icons: [
      { ...icon, purpose: "any" },
      { ...icon, purpose: "maskable" },
    ],
  };
  const headInsert = `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <link rel="manifest" href="${strToBlobUrl(JSON.stringify(manifest))}">
    <link rel="icon" href="${icon.src}">
    <title>${manifest.name}</title>
    <style>/* veps prelude */*{box-sizing:border-box;color:#000;background:#fff}@media(prefers-color-scheme:dark){*{color:#fff;background:#000}}</style>
  `;
  document.head.insertAdjacentHTML("afterbegin", headInsert);
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
