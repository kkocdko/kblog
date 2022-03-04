```
title: Using VSCode Web Server Variant
date: 2022.01.14 02:25
tags: Tutorial Code JavaScript VSCode
description: Not just for fun
```

> Last tested version is `1.65.0`, may become invalid in a future version.

## Why & Why Not?

### Advantages

- Live as a tab on your browser, more convenient when you switch between webpage and editor frequently

- Haven't another renderer process, less memory usage.

- Origin extension market, not [code-server](https://github.com/coder/code-server)'s market.

- It's cool!

### Disadvantages

- Not officially supported. See [this issue](https://github.com/microsoft/vscode/issues/121116#issuecomment-818696827).

- Key shortcut conflicts. `Ctrl + W` will close the browser tab instead of current file.

- Some functions like workspace trust were missing.

## Guide

First, the download link is [server-win32-x64-web](https://update.code.visualstudio.com/latest/server-win32-x64-web/stable) and [server-linux-x64-web](https://update.code.visualstudio.com/latest/server-linux-x64-web/stable).

```
https://update.code.visualstudio.com/latest/ {target} /stable
```

Create directory named `vscode` with folder `data`, `inner` and `misc`.

Extract the package to `inner`, the you can directly execute `./inner/server.sh(bat)`.

To change data directory, use custom token and port, `./run.sh`:

```shell
export VSCODE_AGENT_FOLDER=./data
./inner/bin/code-server.sh --port=8109 --connection-token=mytoken
```

But a lot of inconvenience here, such as build tasks always fail when offline. So there is a patch `./misc/patch.js`:

```javascript
"use strict"; // Last Tested Version: 1.65.0
const patch = (path, replaceList) => {
  const fs = require("fs");
  const filePath = require("path").join(__dirname, "../inner", path);
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
    `"https://{{uuid}}.vscode-webview.net/{{quality}}/{{commit}}`,
    `location.origin+"/static`,
  ],
]);
patch("./out/vs/workbench/contrib/webview/browser/pre/main.js", [
  // Webview: add id to create an unique service worker scope
  ["service-worker.js?", "service-worker.js?_id=${ID}&"],
]);
patch("./out/vs/workbench/api/node/extensionHostProcess.js", [
  // Webview: block resources to avoid long waiting
  [`webviewResourceBaseHost="`, `webviewResourceBaseHost="//`],
]);
```
