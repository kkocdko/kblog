"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const zlib = require("zlib");

const config = {
  ip: "127.0.0.1",
  port: 4000,
  delay: 0,
  dir: path.join(__dirname, "..", "public"),
};

const mime = {
  html: "text/html;charset=utf-8",
  css: "text/css",
  js: "application/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  png: "image/png",
  webp: "image/webp",
};

const server = http.createServer(async (req, res) => {
  if (config.delay) await new Promise((r) => setTimeout(r, config.delay));
  const pathname = path.join(config.dir, req.url.split("?")[0]);
  const queryChain = [
    [200, pathname],
    [200, path.join(pathname, "index.html")],
    [404, path.join(config.dir, "404.html")],
  ];
  for (const [statusCode, filePath] of queryChain) {
    if (!(fs.existsSync(filePath) && fs.statSync(filePath).isFile())) continue;
    res.writeHead(statusCode, {
      "Content-Type": mime[path.extname(filePath).slice(1)] || "",
      "Content-Encoding": "br",
    });
    res.end(zlib.brotliCompressSync(fs.readFileSync(filePath)));
    return;
  }
  res.writeHead(404).end("404 Not Found");
});
server.listen(config.port, config.ip);
console.info(`server address: ${config.ip}:${config.port}`);
process.stdin.on("data", () => process.exit());
