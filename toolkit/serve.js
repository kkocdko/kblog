"use strict";

const port = 4000;
const mime = { html: "text/html;charset=utf8", js: "text/javascript" };
const fs = require("fs");
const r2a = require("path").join.bind(null, __dirname, "../public");
const server = require("http").createServer(({ url }, res) => {
  const pair = [
    [200, r2a(url)],
    [200, r2a(url, "index.html")],
    [404, r2a("404.html")],
  ].find(([_, p]) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!pair) return res.writeHead(404).end("404 Not Found");
  const [status, local] = pair;
  res.setHeader("content-type", mime[local.split(".").pop()] || "");
  res.writeHead(status).end(fs.readFileSync(local));
});
console.info("server: 127.0.0.1:" + server.listen(port).address().port);
