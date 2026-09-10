// vercel cli alternative, for uploading lightweight static site
// better ip for china mainland user: https://github.com/xingpingcn/enhanced-FaaS-in-China/raw/refs/heads/main/Vercel.json
import fs from "node:fs";
import path from "node:path";
const dir = "public";
const token = process.env.VERCEL_TOKEN || "vcp_xxx";
const name = process.env.VERCEL_PROJECT_NAME || "kkocdko-site"; // in the only team
const req = { name, target: "production", files: [] };
req.files.push({
  file: "vercel.json",
  data: '{ "framework": null, "headers": [{ "source": "/(.*)", "headers": [{ "key": "Cache-Control", "value": "max-age=30, stale-while-revalidate=604800" }] }] }',
  encoding: "utf-8",
});
const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
for (const entry of entries) {
  if (entry.isDirectory()) continue;
  if (!entry.isFile()) throw new Error("unknown entry in dir");
  const p = path.join(entry.parentPath, entry.name);
  const encoding = /\.(html|css|js|jsonc?|svg)$/.test(p) ? "utf-8" : "base64";
  req.files.push({
    file: path.relative(dir, p).replaceAll("\\", "/"),
    data: fs.readFileSync(p, { encoding }),
    encoding,
  });
}
const body = /* zlib.gzipSync */ new TextEncoder().encode(JSON.stringify(req)); // vercel did not support Content-Encoding gzip
console.log(`> size = ${Math.round(body.byteLength / 1024)} KiB`);
const response = await fetch("https://api.vercel.com/v13/deployments", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body,
});
console.log("> " + JSON.stringify(await response.json()) + "\n> exit");
