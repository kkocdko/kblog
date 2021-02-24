"use strict";

const address = "127.0.0.1:4000";
const mime = { html: "text/html;charset=utf-8", js: "text/javascript" };
const fs = require("fs");
const r2a = require("path").join.bind(null, __dirname, "../public");
const createServer = require("http").createServer;
createServer(({ url }, res) => {
  const pair = [
    [200, r2a(url)],
    [200, r2a(url + "index.html")],
    [404, r2a("404.html")],
  ].find(([_, p]) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!pair) return res.writeHead(404).end("404 Not Found");
  const [status, filePath] = pair;
  res.setHeader("content-type", mime[filePath.split(".").pop()] || "");
  res.writeHead(status).end(fs.readFileSync(filePath));
}).listen(...address.split(":").reverse());
console.info("server address: " + address);
