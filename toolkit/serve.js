/*!
 * Github-Pages-Like server
 *
 * A simple static server that imitate the work of Github Pages's server
 */
"use strict";

const path = require("path");
const fs = require("fs");
const http = require("http");
const readline = require("readline");

const config = {
  ip: "127.0.0.1",
  port: 4000,
  rootDir: path.join(__dirname, "..", "public"),
};

const mimeList = {
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
  const url = new URL("http://" + req.headers.host + req.url);
  const localPath = path.join(config.rootDir, url.pathname.replace(/\/$/, ""));
  res.on("pipe", (src) => {
    src.on("end", () => {
      res.end();
    });
  });
  fs.stat(localPath, (e, stats) => {
    if (!e && stats.isFile()) {
      // Is file
      const extension = path.parse(localPath).ext.slice(1);
      const contentType = mimeList[extension] || "";
      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(localPath).pipe(res);
    } else {
      const pageFilePath = path.join(localPath, "index.html");
      fs.stat(pageFilePath, (e, stats) => {
        if (!e && stats.isFile()) {
          // Is folder with index.html
          if (url.pathname.endsWith("/")) {
            res.writeHead(200, { "Content-Type": mimeList.html });
            fs.createReadStream(pageFilePath).pipe(res);
          } else {
            // Url should ended with "/"
            url.pathname += "/";
            res.writeHead(302, { Location: url.href });
            res.end();
          }
        } else {
          // Error
          res.writeHead(404, { "Content-Type": mimeList.html });
          const pageFilePath = path.join(config.rootDir, "404.html");
          fs.stat(pageFilePath, (e, stats) => {
            if (!e && stats.isFile()) {
              fs.createReadStream(pageFilePath).pipe(res);
            } else {
              res.end("404 not found");
            }
          });
        }
      });
    }
  });
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    server.close();
    config.port++; // Try next port
    server.listen(config.port, config.ip);
  } else {
    throw e;
  }
});

server.on("listening", () => {
  console.info(`server address: ${config.ip}:${config.port}`);
});

server.listen(config.port, config.ip);
const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
readlineInterface.question("", () => {
  readlineInterface.close();
  server.close();
  process.exit();
});
