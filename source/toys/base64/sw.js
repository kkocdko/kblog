const list = [
  "1610918896274 | ./",
  "1610918896274 | ./manifest.json",
  "1610918896274 | ./favicon.svg",
  // "1610918896274 | /toy/misc/example.css",
];

// 20210119-0229
const inInstall = async () => {
  const [tasks, prev, cache] = [[], {}, await caches.open(location)];
  for (const { url, headers } of await cache.matchAll())
    prev[url] = Date.parse(headers.get("date"));
  for (const [date, url] of list.map((line) => line.split(" | "))) {
    const req = new Request(url, { mode: "cors" });
    if (date > (prev[req.url] || 0)) tasks.push(cache.add(req));
    delete prev[req.url];
  }
  for (const url in prev) tasks.push(cache.delete(url));
  await Promise.allSettled(tasks);
};
const inFetch = async (req) =>
  (await (await caches.open(location)).match(req)) || fetch(req);
oninstall = (e) => e.waitUntil(inInstall());
onfetch = (e) => e.respondWith(inFetch(e.request));
