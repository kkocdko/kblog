```
title: 用UserJS注入UserCSS
date: 2019-04-06 17:41:23
category: Code
tags: Javascript UserJS CSS UserCSS
description: 避免安装太多拓展
```

### Introduction

加载UserCSS需要[Stylish](https://userstyles.org)这样的拓展，但是我通常希望避免安装太多拓展，特别是在内存不宽裕的情况下。

使用UserJS注入CSS是个不错的选择。只需装一个脚本管理器，就能使用UserJS+UserCSS，一个顶俩。

这里给出一个简洁的模板：

```javascript
// ==UserScript==
// @name         InsertUserCSS
// @include      *://example.com/*
// ==/UserScript==
'use strict'

document.body.insertAdjacentHTML('beforeend', `<style>

body {
  background: #000;
}

</style>`)
```

示例：<https://greasyfork.org/scripts/371302>
