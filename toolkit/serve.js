/*!
 * Github-Pages-Like server
 *
 * A simple static server that imitate the work of Github Pages's server
 */
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
  html: "text/html; charset=UTF-8",
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
  let localPath = path.join(config.dir, req.url.split("?")[0]);
  let statusCode;
  try {
    if (fs.statSync(localPath).isDirectory()) {
      const pageFilePath = path.join(localPath, "index.html");
      if (fs.statSync(pageFilePath).isFile()) {
        localPath = pageFilePath;
      } else {
        throw 1;
      }
    }
    statusCode = 200;
  } catch {
    const pageFilePath = path.join(config.dir, "404.html");
    if (fs.existsSync(pageFilePath)) {
      localPath = pageFilePath;
    } else {
      localPath = "";
    }
    statusCode = 404;
  }
  setTimeout(() => {
    if (localPath) {
      const extension = path.parse(localPath).ext.slice(1);
      const contentType = mime[extension] || "";
      res.writeHead(statusCode, { "Content-Type": contentType });
      const stream = fs.createReadStream(localPath);
      stream.pipe(res).on("end", () => res.end());
    } else {
      res.writeHead(statusCode).end(statusCode);
    }
  }, config.delay);
});

server.listen(config.port, config.ip);
server.on("listening", () => {
  console.info(`server address: ${config.ip}:${config.port}`);
});

process.stdin.on("data", () => process.exit());
