"use strict";

const cfg = {
  host: "127.0.0.1:4000",
  delay: 0,
};

const mime = {
  html: "text/html;charset=utf-8",
  css: "text/css",
  js: "application/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const fs = require("fs");
const path = require("path");
const r2a = path.join.bind(null, __dirname, "../public");
const serve = require("http").createServer;
serve(async (req, res) => {
  if (cfg.delay) await new Promise((r) => setTimeout(r, cfg.delay));
  const pair = [
    [200, r2a(req.url)],
    [200, r2a(req.url + "index.html")],
    [404, r2a("404.html")],
  ].find(([_, p]) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!pair) return res.writeHead(404).end("404 Not Found");
  const [status, filePath] = pair;
  const mimeType = mime[path.extname(filePath).slice(1)];
  if (mimeType) res.setHeader("content-type", mimeType);
  res.writeHead(status).end(fs.readFileSync(filePath));
}).listen(...cfg.host.split(":").reverse());
console.info("server address: " + cfg.host);
process.stdin.on("data", () => process.exit());
