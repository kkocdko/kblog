```
title: Using VSCode Web Server Variant
date: 2022.01.14 02:25
tags: Tutorial Code JavaScript VSCode
description: Not just for fun
```

> Last tested version is `1.84.2 (2023-11-09T10:19:36.564Z)`, may become invalid in a future version.

## Why & Why Not?

### Advantages

- As a tab on browser, more convenient. Haven't redundant renderer process, less memory footprint.

- Bypass Electron's IME issues on Linux Wayland.

- Origin extension market, not [coder/code-server](https://github.com/coder/code-server)'s market.

- It's cool!

### Disadvantages

- Not officially supported. See [this issue](https://github.com/microsoft/vscode/issues/121116#issuecomment-818696827).

- Key shortcut conflicts, like `Ctrl + W` will close the browser tab (PWA mode fixes this).

## Guide

First, the download link is:

```
https://update.code.visualstudio.com/latest/{target}/stable
```

`{target}` = `server-win32-x64-web`, `server-linux-x64-web` or others.

Extract the package, then execute `./bin/code-server(.bat)`.

To change data directory, use custom token and port, `./run.sh`:

```shell
# export VSCODE_AGENT_FOLDER=./data
./bin/code-server --accept-server-license-terms --host 127.0.0.1 --port=8109 --connection-token=mytoken
```

But a lot of inconvenience here, such as build tasks always fail when offline. So there is a patch `./misc/patch.js`:

```javascript
// Last Tested Version: 1.84.2
const fs = require("node:fs");
if (!fs.existsSync("./out/vs/server/node/server.cli.js"))
  throw Error("current dir wrong");
const patch = (filePath, replaceList) => {
  const bakPath = filePath + `.bak`;
  if (!fs.existsSync(bakPath)) fs.renameSync(filePath, bakPath);
  let content = fs.readFileSync(bakPath).toString();
  for (const [search, value] of replaceList) {
    const fn = search instanceof RegExp ? "replace" : "replaceAll";
    content = content[fn](search, value);
  }
  fs.writeFileSync(filePath, content);
};
patch("./out/vs/workbench/workbench.web.main.js", [
  // Replace entry url with local server to allow offline work (for webview)
  // Source: src/vs/workbench/services/environment/browser/environmentService.ts
  [`"https://{{uuid}}.vscode-cdn.net/{{quality}}/{{commit}}`, `baseUrl+"`],
  // Store user settings in remote machine
  // [`("/User").with({`, `("/opt/vsc/User").with({scheme:"vscode-remote"});({`],
]);
patch("./out/vs/workbench/contrib/webview/browser/pre/index.html", [
  // Modify CSP (for webview)
  // Source: src/vs/workbench/contrib/webview/browser/pre/index.html
  [/\'sha256.+?\'/, "'unsafe-inline'"],
  // Bypass hostname vertify (for webview)
  // Source: src/vs/workbench/contrib/webview/browser/pre/index.html
  [/\.padStart\(52.+?\)/, "&&location.hostname"],
]);
patch("./out/vs/code/browser/workbench/workbench.html", [
  [
    `</html>`,
    `<script>\n(${(() => {
      const waitForMark = (mark) =>
        new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            if (list.getEntries().find((entry) => entry.name === mark)) {
              observer.disconnect();
              resolve();
            }
          });
          observer.observe({ entryTypes: ["mark"] });
        });
      const executeCommand = require("vs/workbench/workbench.web.main").commands
        .executeCommand;
      (async () => {
        await waitForMark("code/didStartWorkbench");
        // The "User Settings" is store in browser (indexedDB), so if you open a page in a fresh incognito window, the update progress will start unexpectedly
        executeCommand("workbench.extensions.action.disableAutoUpdate");
        // An example command which cause visable changes for easier testing
        // executeCommand("workbench.action.toggleLightDarkThemes");
      })();
    }).toString()})();\n</script>\n</html>`,
  ],
]);
const spdlogDirPath = "node_modules/@vscode/spdlog";
fs.rmSync(spdlogDirPath, { recursive: true, force: true });
fs.mkdirSync(spdlogDirPath);
fs.writeFileSync(
  spdlogDirPath + "/package.json",
  JSON.stringify({ version: "0.13.7", main: "index.js" }) + "\n"
);
fs.writeFileSync(
  spdlogDirPath + "/index.js",
  `(${(() => {
    const fs = require("node:fs");
    const path = require("node:path");
    function Logger(_name, filepath) {
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
    const createLogger = (_1, name, filepath, _2, _3) =>
      new Promise((resolve) => resolve(new Logger(name, filepath)));
    exports.createRotatingLogger = (name, filepath, maxSize, maxFiles) =>
      createLogger("rotating", name, filepath);
    exports.createAsyncRotatingLogger = (name, filepath, maxSize, maxFiles) =>
      createLogger("rotating_async", name, filepath);
    exports.setLevel = exports.setFlushOn = () => {};
    exports.version = 11100;
  }).toString()})();\n`
);
// rm -rf ~/.vscode-server/extensions/redhat.java-*/jre/
// rm -rf ~/.vscode-server/extensions/ms-python.python-*/pythonFiles/lib/python/debugpy/_vendored/pydevd/pydevd_attach_to_process/
// rm -rf ~/.vscode-server/extensions/ms-python.python-*/out/client/extension.js.map*
```

- There is a bug that caused UI freezed when entering debug after `1.65`. **(UPDATED)** [Patch is merged into mainline](https://github.com/microsoft/vscode/commit/7046d66).

- Because [node-spdlog](https://github.com/microsoft/node-spdlog) and [node-pty](https://github.com/microsoft/node-pty) were both use NAN, so cross NodeJS version is hard to do (especially when you want pointer compression enabled). You can use a faked spdlog and [daniel-brenot's node-pty fork](https://github.com/daniel-brenot/node-pty). **(UPDATED)** Recommand to use my [PR in node-pty to migrate to NAPI](https://github.com/microsoft/node-pty/pull/644)
