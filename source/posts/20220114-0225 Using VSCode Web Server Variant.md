```
title: Using VSCode Web Server Variant
date: 2022.01.14 02:25
tags: Tutorial Code JavaScript VSCode
description: Not just for fun
```

> Last tested version is `1.85.1 (2023-12-13T09:14:51.474Z)`, may become invalid in a future version.

### Pros

- As a tab on browser, more convenient. Haven't redundant renderer process, less memory footprint.

- Bypass Electron's IME issues on Linux Wayland.

- Official extension market, not [coder/code-server](https://github.com/coder/code-server)'s market.

### Cons

- Not officially supported. See [this issue](https://github.com/microsoft/vscode/issues/121116#issuecomment-818696827).

- Key shortcut conflicts like `Ctrl + W` will close the browser tab (PWA mode fixes this).

## Guide

Download and extract `https://update.code.visualstudio.com/latest/{target}/stable` (`{target}` = `server-win32-x64-web`, `server-linux-x64-web` or others).

Then use `./bin/code-server(.bat)` or write a custom `./run.sh`:

```shell
cd $(dirname $0)
# export VSCODE_AGENT_FOLDER=$(pwd)/agent_folder # chaneg the data directory
# export UV_USE_IO_URING=0 # avoid bug in nodejs 21
node ./out/server-main.js --accept-server-license-terms --host 0.0.0.0 --port 8109 --connection-token=mytoken
```

And here's a `patch.js` to workaround some issues like offline webview, see comments for details:

```javascript
// Last Tested Version: 1.85.1
const fs = require("node:fs");
if (!fs.existsSync("./out/vs/server/node/server.cli.js"))
  throw Error("current dir wrong");
const patch = (filePath, replaceList) => {
  const bakPath = filePath + `.bak`;
  if (!fs.existsSync(bakPath)) fs.renameSync(filePath, bakPath);
  let content = fs.readFileSync(bakPath).toString();
  for (const [from, to] of replaceList) {
    const testFn = from instanceof RegExp ? "match" : "includes";
    const replaceFn = from instanceof RegExp ? "replace" : "replaceAll";
    if (!content[testFn](from))
      console.error("Patch entry not found", { from, to });
    content = content[replaceFn](from, to);
  }
  fs.writeFileSync(filePath, content);
};
patch("./out/vs/workbench/workbench.web.main.js", [
  // > src/vs/workbench/services/environment/browser/environmentService.ts
  [`"https://{{uuid}}.vscode-cdn.net/{{quality}}/{{commit}}`, `baseUrl+"`], // Replace entry url with local server to allow offline work (for webview)
  // > src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts
  [/(?<="extensions.autoUpdate":\{.+?,default:).+?,/, "false,"], // Set "extensions.autoUpdate" default = false. Because the "User Settings" is store in browser (indexedDB), so if you open a page in a fresh incognito window, the update progress will start unexpectedly
]);
patch("./out/vs/workbench/contrib/webview/browser/pre/index.html", [
  // > src/vs/workbench/contrib/webview/browser/pre/index.html
  [/\'sha256.+?\'/, "'unsafe-inline'"], // Modify CSP (for webview)
  [/\.padStart\(52.+?\)/, "&&location.hostname"], // Bypass hostname vertify (for webview)
]);
const spdlogDirPath = "node_modules/@vscode/spdlog";
fs.rmSync(spdlogDirPath, { recursive: true, force: true });
fs.mkdirSync(spdlogDirPath);
fs.writeFileSync(
  spdlogDirPath + "/package.json",
  JSON.stringify({ version: "0.13.99", main: "index.js" }) + "\n"
);
fs.writeFileSync(
  spdlogDirPath + "/index.js",
  `(${(() => {
    const fs = require("node:fs");
    const path = require("node:path");
    function Logger(name, filepath) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
      const fd = fs.openSync(filepath, "a");
      const write = (v) =>
        fs.write(fd, "[" + Date.now() + "] " + v.trimEnd() + "\n", () => {});
      this.debug = this.info = this.warn = write;
      this.error = this.critical = this.trace = write;
      this.getLevel = () => 2;
      this.setLevel = this.setPattern = this.clearFormatters = () => {};
      this.flush = () => fs.fsync(fd, () => {});
      this.drop = () => fs.close(fd);
    }
    const create = (name, filepath, maxSize, maxFiles) =>
      new Promise((resolve) => resolve(new Logger(name, filepath)));
    exports.createAsyncRotatingLogger = exports.createRotatingLogger = create;
    exports.setLevel = exports.setFlushOn = () => {};
    exports.version = 11100;
  }).toString()})();\n`
);
// rm -rf ~/.vscode-server/data/Cached*
// rm -rf ~/.vscode-server/extensions/redhat.java-*/jre/
// rm -rf ~/.vscode-server/extensions/ms-python.python-*/pythonFiles/lib/python/debugpy/_vendored/pydevd/pydevd_attach_to_process/
// rm -rf ~/.vscode-server/extensions/ms-python.python-*/out/client/extension.js.map*
```

- There's a bug that caused UI freezed when entering debug after `1.65`. **(UPDATED)** [Patch is merged into mainline](https://github.com/microsoft/vscode/commit/7046d66).

- Can not install extensions after Node.js 21. **(UPDATED)** [Patch is merged into mainline](https://github.com/microsoft/vscode/pull/200935).

- Because [node-spdlog](https://github.com/microsoft/node-spdlog) and [node-pty](https://github.com/microsoft/node-pty) were both use NAN, so cross NodeJS version needs recompiling. You can use a faked spdlog (included in above `patch.js`) and [daniel-brenot's node-pty fork](https://github.com/daniel-brenot/node-pty). **(UPDATED)** Recommand to use my [PR in node-pty to migrate to NAPI](https://github.com/microsoft/node-pty/pull/644).
