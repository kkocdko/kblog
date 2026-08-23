// to replace vercel cli for uploading lightweight static site
/*
// old script backup:
#!/bin/sh
node . generate
cd public
mkdir -p .vercel
echo '{ "projectId": "prj_xxx", "orgId": "team_xxx" }' > .vercel/project.json # use vercel link
echo '{ "framework": null, "headers": [{ "source": "/(.*)", "headers": [{ "key": "Cache-Control", "value": "max-age=30, stale-while-revalidate=604800" }] }] }' > vercel.json
install -Dp ~/misc/code/utils4linux/proxy/dist/config-1-11.jsonc hidden/proxy/config.jsonc # todo: move to 1.12
vercel whoami
vercel pull --prod
vercel build --prod
vercel deploy --prod --prebuilt --archive=tgz
cd ..
# npm i -g vercel # 41.0.2 , you can remove all inside `./vercel/node_modules/` except of the `@vercel`
# /home/kkocdko/misc/apps/nodejs/lib/node_modules/vercel
# ncc build dist/vc.js -o ncc-dist --target es2022 -m --no-cache --no-source-map-register
# import {pathToFileURL}from "node:url";
# const __filename = import.meta.filename;
# var __import_meta_url__ = (__webpack_require__(57310).pathToFileURL)(__filename).href;
# file:///home/kkocdko/misc/apps/nodejs/lib/node_modules/vercel/dist/518.index.js:47938
*/
import fs from "node:fs";
import path from "node:path";
// import zlib from "node:zlib";
const dir = "public";
const token = "vcp_xxx";
const name = "kkocdko-site";
const team = "kkocdko-team";
const req = {
  name,
  target: "production",
  files: [],
};
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
const body = /* zlib.gzipSync */ JSON.stringify(req);
console.log("size = ", body.length, body?.byteLength);
const url = "https://api.vercel.com/v13/deployments?teamId=" + team;
const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
    // "Content-Encoding": "gzip", // vercel did not support it
  },
  body,
});
console.log(await response.json());
