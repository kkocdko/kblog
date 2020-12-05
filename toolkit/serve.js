"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");

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
  md: "text/markdown",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  png: "image/png",
  webp: "image/webp",
};

const server = http.createServer((req, res) => {
  const pathname = path.join(config.dir, req.url.split("?")[0]);
  const chain = [
    () => [200, pathname],
    () => [200, pathname + ".html"],
    () => [200, path.join(pathname, "index.html")],
    () => [404, path.join(config.dir, "404.html")],
  ];
  const respond = (statusCode, targetPath) => {
    if (!fs.statSync(targetPath).isFile()) throw 1;
    const extension = path.extname(targetPath).slice(1);
    const contentType = mime[extension] || "";
    res.writeHead(statusCode, { "Content-Type": contentType });
    const stream = fs.createReadStream(targetPath);
    stream.pipe(res).on("end", () => res.end());
  };
  setTimeout(() => {
    for (const pair of chain) {
      try {
        respond(...pair());
        return;
      } catch {}
    }
    res.writeHead(404).end("404 Not Found");
  }, config.delay);
});
server.listen(config.port, config.ip);
server.on("listening", () => {
  console.info(`server address: ${config.ip}:${config.port}`);
});
process.stdin.on("data", () => process.exit());
