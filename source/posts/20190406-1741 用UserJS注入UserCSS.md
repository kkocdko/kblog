```
title: 用UserJS注入UserCSS
date: 2019.04.06 17:41
tags: Code Javascript CSS
description: 避免安装太多拓展
```

通常，加载 UserCSS 需要 [Stylish](https://userstyles.org) 这样的拓展。但我希望避免安装太多拓展，特别是在内存不宽裕的情况下。

使用 UserJS 注入 CSS 是个不错的选择。只需装一个脚本管理器，就能使用 UserJS + UserCSS，一个顶俩。

这里给出一个简洁的模板：

```javascript
// ==UserScript==
// @name         User CSS Example
// @match        *://example.com/*
// ==/UserScript==
document.lastChild.appendChild(document.createElement("style")).textContent = `

body {
  background: #000;
}

`.replaceAll(";", "!important;");
```

示例：<https://greasyfork.org/scripts/371302>
