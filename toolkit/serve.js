"use strict";

const cfg = {
  host: "127.0.0.1:4000",
  delay: 0,
  dir: "./public",
  h2: process.argv.includes("--h2"),
};

const fs = require("fs");
const path = require("path");
const brotil = require("zlib").brotliCompressSync;
const mime = {
  html: "text/html;charset=utf-8",
  css: "text/css",
  js: "application/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  webp: "image/webp",
};
const r2a = path.join.bind(null, __dirname, "..", cfg.dir);
const caches = new Map();
const readFileBr = (p) => {
  if (!caches.has(p)) caches.set(p, brotil(fs.readFileSync(p)));
  return caches.get(p);
};
let serve = require("http2").createSecureServer;
if (!cfg.h2) serve = require("http").createServer;
const opt = {
  // Using [mkcert](https://github.com/FiloSottile/mkcert)
  cert: cfg.h2 && fs.readFileSync(r2a("../toolkit/ssl-cert.pem")),
  key: cfg.h2 && fs.readFileSync(r2a("../toolkit/ssl-cert-key.pem")),
};
serve(opt, async (req, res) => {
  if (cfg.delay) await new Promise((r) => setTimeout(r, cfg.delay));
  const pair = [
    [200, r2a(req.url)],
    [200, r2a(req.url, "index.html")],
    [404, r2a("404.html")],
  ].find(([_, p]) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!pair) return res.writeHead(404).end("404 Not Found");
  const [status, filePath] = pair;
  res.setHeader("content-type", mime[path.extname(filePath).slice(1)] || "");
  res.setHeader("content-encoding", "br");
  res.writeHead(status).end(readFileBr(filePath));
  if (!(cfg.h2 && req.url === "/")) return;
  const pushPath = "/bundle.js";
  res.createPushResponse({ ":path": pushPath }, (_, pushRes) => {
    pushRes.setHeader("content-encoding", "br");
    pushRes.end(readFileBr(r2a(pushPath)));
  });
}).listen(...cfg.host.split(":").reverse());
console.info(`server address: http${cfg.h2 ? "s" : ""}://${cfg.host}`);
process.stdin.on("data", () => process.exit());
