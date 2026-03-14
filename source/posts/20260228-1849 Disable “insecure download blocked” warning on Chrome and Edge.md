```
title: Disable “insecure download blocked” warning on Chrome and Edge
date: 2026.02.28 18:49
tags: Chrome Browser
description: Avoid annoy warning, supports Chrome 145+
```

🌐 - [简体中文](#lang_zh-cn)

Chrome blocks downloads from HTTP sources or files like `.exe`, displaying warnings like “insecure download blocked” and requiring manual approval each time.

At least starting from Chrome 124, [this](https://superuser.com/q/1410783) and [this popular answer](https://support.google.com/chrome/thread/250890537/insecure-download-exception?hl=en) are not useful at all.

<img alt="screenshot-warning" width="466.67" height="530.67" src="https://github.com/kkocdko/kblog/releases/download/simple_storage/chrome-insecure-download-1.webp">

## Solution / Workaround

Open `chrome://settings/content/insecureContent`, in "Allowed to show insecure content" list, add `http://*` and `https://*`.

<img alt="screenshot-solution" width="692" height="773.6" src="https://github.com/kkocdko/kblog/releases/download/simple_storage/chrome-insecure-download-2.webp">

Yes. This is the only effective method I've found.

Previously, this page had a toggle switch that could be clicked directly. Later, in some version, the switch was removed, allowing only the addition of domains one by one.

I feel this method is somewhat of an abuse, they (the Chrome developers) probably didn't anticipate that wildcards could be entered.

## 🌐

<details>
<summary>简体中文</summary><p id="lang_zh-cn" style="position:relative;top:-3em"></p>

新版本 Chrome 在下载 http 来源的内容，或者 exe 等可执行文件时，会提示 “已拦截未经验证的下载内容”、“已阻止不安全的下载” 阻止下载，每次都要手动放行。

至少从 Chrome 124 版本开始, [这个](https://superuser.com/q/1410783) 和 [这个流行的答案](https://support.google.com/chrome/thread/250890537/insecure-download-exception?hl=en) 已经完全失效。

<img alt="screenshot-warning" width="466.67" height="530.67" src="https://github.com/kkocdko/kblog/releases/download/simple_storage/chrome-insecure-download-1.webp">

## 解决绕过方法

打开 `chrome://settings/content/insecureContent`，在“允许显示不安全内容”列表中，添加 `http://*` 和 `https://*` ，即可完全绕过此限制。

<img alt="screenshot-solution" width="692" height="773.6" src="https://github.com/kkocdko/kblog/releases/download/simple_storage/chrome-insecure-download-2.webp">

是的。这是我找到的唯一有效的办法。

曾经，在这个页面，有个 switch 切换开关，可以直接点击。后来，某个版本把开关删掉了，只允许一个一个添加域名。

我觉得，我这个办法属于滥用，他们（Chrome 的开发者们）或许没想到可以填进去通配符。

> kkocdko 首发于 20240706 [ungoogled-chromium_issue-2940](https://github.com/ungoogled-software/ungoogled-chromium/issues/2940)

</details>
