"use strict";

/**
 * First, use [mkcert](https://github.com/FiloSottile/mkcert) to generate and install certificate.
 */

const fs = require("fs");
const path = require("path");
const http2 = require("http2");
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

const readFileBr = (() => {
  const caches = new Map();
  return (filePath) => {
    if (!caches.has(filePath)) {
      const fileBuf = fs.readFileSync(filePath);
      const brotilBuf = zlib.brotliCompressSync(fileBuf);
      // console.log(brotilBuf.length);
      caches.set(filePath, brotilBuf);
    }
    return caches.get(filePath);
  };
})();

const hasFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();

const server = http2.createSecureServer({
  key: fs.readFileSync(path.join(__dirname, "cert/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "cert/cert.pem")),
});

server.on("stream", async (stream, headers) => {
  if (config.delay) await new Promise((r) => setTimeout(r, config.delay));
  const pathname = path.join(config.dir, headers[":path"].split("?")[0]);
  const queryChain = [
    [200, pathname],
    [200, path.join(pathname, "index.html")],
    [404, path.join(config.dir, "404.html")],
  ];
  for (const [status, filePath] of queryChain) {
    if (!hasFile(filePath)) continue;
    stream.respond({
      // ":status": status,
      "content-type": mime[path.extname(filePath).slice(1)],
      "content-encoding": "br",
      date: "",
    });
    if (headers[":path"] === "/") {
      const pushPath = "/bundle.js";
      stream.pushStream({ ":path": pushPath }, (_, pushStream) => {
        pushStream.respond({ "content-encoding": "br", date: "" });
        pushStream.write(readFileBr(path.join(config.dir, pushPath)));
        pushStream.end();
      });
    }
    stream.write(readFileBr(filePath));
    stream.end();
    return;
  }
  stream.respond({ ":status": 404 });
  stream.end("404 Not Found");
});

server.listen(config.port, config.ip);
console.info(`server address: ${config.ip}:${config.port}`);
process.stdin.on("data", () => process.exit());

// const fs = require("fs");
// const path = require("path");
// const http2 = require("http2");
// const zlib = require("zlib");
// const config = {
//   ip: "127.0.0.1",
//   port: 4000,
//   dir: path.join(__dirname, "..", "public"),
// };
// const path2brotil = (p) =>
//   zlib.brotliCompressSync(fs.readFileSync(path.join(config.dir, p)));
// const caches = {
//   bundle: path2brotil("/bundle.js"),
//   homepage: path2brotil("/index.html"),
// };
// const server = http2.createSecureServer({
//   key: fs.readFileSync(path.join(__dirname, "cert/key.pem")),
//   cert: fs.readFileSync(path.join(__dirname, "cert/cert.pem")),
// });
// server.on("stream", (stream) => {
//   stream.pushStream({ ":path": "/bundle.js" }, (_, pushStream) => {
//     pushStream.respond({
//       "content-encoding": "br",
//       date: "",
//     });
//     pushStream.write(caches.bundle);
//     pushStream.end();
//   });
//   stream.respond({
//     // ":status": 200,
//     "content-type": "text/html;charset=utf-8",
//     "content-encoding": "br",
//     date: "",
//   });
//   stream.write(caches.homepage);
//   stream.end();
// });
// server.listen(config.port, config.ip);
// console.info(`server address: ${config.ip}:${config.port}`);
// process.stdin.on("data", () => process.exit());
