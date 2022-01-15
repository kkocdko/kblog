```
title: Using VSCode Web Server Variant
date: 2022.01.14 02:25
tags: Tutorial Code JavaScript VSCode
description: Not just for fun
```

> Last tested version is `1.63.2`, may become invalid in a future version.

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

Extract the package to `./inner`, the you can directly execute `./inner/server.sh(bat)`.

To change data directory, use custom token and port, `./run.sh`:

```shell
export VSCODE_AGENT_FOLDER=./data
./inner/server.sh --port=8109 --connection-token=mytoken
```

But a lot of inconvenience here, such as build tasks always fail when offline. So there is a patch `./misc/patch.js`:

```javascript
"use strict"; // Last Tested Version: 1.63.2

const path = require("path");
const fs = require("fs");

const modify = {};
modify._modifyText = (relativePath, processor) => {
  const filePath = path.join(__dirname, "../inner", relativePath);
  const bakPath = filePath + `.bak`;
  const hasBak = fs.existsSync(bakPath);
  if (!hasBak) fs.renameSync(filePath, bakPath);
  const content = fs.readFileSync(bakPath).toString();
  fs.writeFileSync(filePath, processor(content)); // Overwrite
};
modify.replaceText = (filePath, list) => {
  modify._modifyText(filePath, (text) => {
    for (const [search, value] of list) {
      if (search instanceof RegExp) {
        text = text.replace(search, value);
      } else {
        text = text.replaceAll(search, value);
      }
    }
    return text;
  });
};

modify.replaceText("./out/vs/workbench/workbench.web.api.js", [
  // Fix build tasks fail when offline, and others
  ['webEndpointUrl:"https://vscodeweb.azureedge.net"', 'webEndpointUrl:""'],
  ["+=`/${this._productService.commit}`", "+=``"],
  ["+=`/${this._productService.quality}`", "+=`/static`"],

  // CSP
  [`http-equiv="Content-Security-Policy"`, ""],

  // WebView
  [
    `this.options.webviewEndpoint||this.productService.webviewContentExternalBaseUrlTemplate||"https://{{uuid}}.vscode-webview.net/{{quality}}/{{commit}}/`,
    `location.origin+"/static/`,
  ],

  // Extension scope `machine`
  // [`case 2:this.handleLocalUserConfiguration`, `case 999999:`],
]);

modify.replaceText("./out/vs/server/remoteExtensionHostAgent.js", [
  // The CSP, allow redirect on webview extensions
  [`"default-src 'self';"`, `""`],
  [`"img-src 'self' https: data: blob:;"`, `""`],
  [`"frame-src 'self' https://vscodeweb.azureedge.net data:;"`, `""`],

  // WebView
  [
    "https://{{uuid}}.vscode-webview-test.com/{{commit}}",
    "/static/out/vs/workbench/contrib/webview/browser/pre/",
  ],

  // Open without connection token, jump `403,"Forbidden."`
  // ["this._environmentService.isBuilt&&!this._hasCorrectTokenCookie", "false&&"],
]);

// modify.replaceText("./out/vs/server/remoteExtensionHostProcess.js", []);

console.log("patch finished");
```
