```
title: Using VSCode Web Server Variant
date: 2022.01.14 02:25
tags: Tutorial Code JavaScript VSCode
description: Not just for fun
```

> Last tested version is `1.71.2`, may become invalid in a future version.

## Why & Why Not?

### Advantages

- As a tab on browser, more convenient. Haven't redundant renderer process, less memory footprint.

- Bypass Electron's IME issues on Wayland.

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

Extract the package, then execute `./bin/code-server.sh(bat)`.

To change data directory, use custom token and port, `./run.sh`:

```shell
export VSCODE_AGENT_FOLDER=./data
./bin/code-server.sh --port=8109 --connection-token=mytoken
```

But a lot of inconvenience here, such as build tasks always fail when offline. So there is a patch `./misc/patch.js`:

```javascript
"use strict"; // Last Tested Version: 1.71.2
const patch = (path, replaceList) => {
  const fs = require("fs");
  const filePath = require("path").join(__dirname, path);
  const bakPath = filePath + `.bak`;
  if (!fs.existsSync(bakPath)) fs.renameSync(filePath, bakPath);
  let content = fs.readFileSync(bakPath).toString();
  for (const [search, value] of replaceList) {
    const fn = search instanceof RegExp ? "replace" : "replaceAll";
    content = content[fn](search, value);
  }
  fs.writeFileSync(filePath, content);
  console.log("patched: " + path);
};
patch("./out/vs/workbench/workbench.web.main.js", [
  // Webview: replaced with local server to allow offline work
  [
    `"https://{{uuid}}.vscode-cdn.net/{{quality}}/{{commit}}`,
    `location.origin+"/{{quality}}-{{commit}}/static`,
  ],
]);
patch("./out/vs/workbench/contrib/webview/browser/pre/index.html", [
  // Webview: bypass hostname vertify
  [/\.padStart\(52.+?\)/, "&&location.hostname"],
  // Webview: modify CSP
  [/\'sha256.+?\'/, "'unsafe-inline'"],
]);
patch("./out/vs/workbench/contrib/webview/browser/pre/service-worker.js", [
  // Webview: bypass requests
  [`addEventListener("fetch",`, "NaN;("],
]);
patch("./out/vs/workbench/api/node/extensionHostProcess.js", [
  // Webview: block resources to avoid long waiting
  [`webviewResourceBaseHost="`, `webviewResourceBaseHost="//`],
]);
```

- ~~There is a bug that caused UI freezed when entering debug after `1.65`.~~ [Patch is merged into mainline](https://github.com/microsoft/vscode/commit/7046d66).
