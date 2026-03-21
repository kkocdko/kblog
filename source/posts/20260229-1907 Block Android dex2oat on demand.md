```
title: Block Android dex2oat on demand
date: 2026.02.29 19:07
tags: Note Android Shell
description: For something like HSBC HK app, requires root
```

🌐 - [简体中文](#lang_zh-cn)

TLDR:

```shell
oat_dir=$(dumpsys package com.package.name | grep codePath= | cut -d= -f2-)/oat ; rm -rf $oat_dir ; touch $oat_dir
```

Root required. Above code will find the app's `codePath`, delete the `oat` dir, then create an empty file to block dex2oat for this app forever.

## Why

IMO, obfuscation should be exclusively for core logic. Alipay use OLLVM to obfuscate only a small subset of its security-sensitive native lib (.so). Applying aggressive obfuscation to general business logic is unnecessary; it seriously degrades performance with no other benefits.

A prime counter-example is the HSBC HK app, which indiscriminately applied heavy hardening to all DEX files. Consequently, despite its minimal feature set (significantly fewer than mainland Chinese banking apps), it manages to achieve a larger size and poorer performance (ironically).

Even worse, because the hardening affects every DEX file, the **app size reaches a staggering 2.9GB** after a full `dex2oat`. As a result, we are looking to restrict Android from running `dex2oat` on this specific app.

After exec the aforementioned command, the size was reduced from 2.9GB to 644MB — a significant improvement. In terms of runtime performance, profiling showed no noticeable regressions.

Developers looking for a shortcut can manually set [`android:vmSafeMode`](https://developer.android.com/guide/topics/manifest/application-element#vmSafeMode) in the manifest to disable AOT compilation (`dex2oat`).

> 20260307: Since v3.67.6, the HSBC HK app's size has decreased slightly; the size after removing the `oat` directory dropped from 635MB to 476MB. However, still expands drastically after `dex2oat`.

## 🌐

<details>
<summary>简体中文</summary><p id="lang_zh-cn" style="position:relative;top:-3em"></p>

太长不看：

```shell
oat_dir=$(dumpsys package com.package.name | grep codePath= | cut -d= -f2-)/oat ; rm -rf $oat_dir ; touch $oat_dir
```

需要 root。上述代码会找到应用的 `codePath`，删除其中的 `oat` 目录，然后创建一个同名空文件来永久阻止对此应用的 dex2oat。

## 为什么

我认为，混淆加固应当只用于核心逻辑。例如支付宝使用 OLLVM 混淆了一小部分安全相关的原生 so 库。而对于通用的业务代码，完全没有必要上强力加固，这会显著影响性能，也没有什么收益。

反面例子就是汇丰香港 HSBC HK app。它只是无脑地对所有 dex 都上了最强力的加固。这使得它在功能简洁（显著少于中国大陆银行 app）的同时，做到了更大的体积和更差的性能（笑）。

更可怕的是，由于它的加固作用于所有 dex，因此，它在完全 dex2oat 之后，**应用体积达到了惊人的 2.9G**。所以现在我们希望限制 Android 在此 app 上运行 dex2oat。

使用前文所提到的命令，运行之后，体积从 2.9G 降低到了 644M 。效果显著。至于运行时性能，我打了 profile 也没有观察到明显区别。

如果作为开发者，想偷懒，那么，可以自行在 manifest 里设置 [`android:vmSafeMode`](https://developer.android.com/guide/topics/manifest/application-element#vmSafeMode) 来禁用 dex2oat。

> 20260307: HSBC HK app 在 3.67.6 版本之后体积略有下降，删除 oat 目录之后的体积 635M -> 476M。但是 dex2oat 后体积依然急剧膨胀。

</details>

<!--
发现个这个： https://as.sogou.com/app/apkdetail?docid=8271386494777466339 。适合用来下载只在国内商店里上架，甚至自家官网都没的应用。目前，很多国内商店的网页端，有些已经无法取消勾选安全下载了。这是我能找到的比较干净的。
-->
