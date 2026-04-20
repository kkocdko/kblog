```
title: 成立 hal-drv 组织，维护一些 Rust embedded-hal 外设驱动
date: 2026.04.21 07:09
tags: Code Rust MCU Embedded
description: 持续维护，保持更新，遵循最佳实践
```

发现给 Rust [`embedded-hal`](https://crates.io/crates/embedded-hal) 实现的很多外设驱动有各种问题，包括但不限于写错，功能不全，没有 async 支持等，很多都是五六年前的了，作者也联系不上。特别是一些国产传感器。

由此，与一名老同学合作，开了这个 GitHub 组织 [hal-drv](https://github.com/hal-drv)，持续维护一些常用的外设驱动，方便各位使用。目前有：

- [github.com/hal-drv/**aht30**](https://github.com/hal-drv/aht30) : 奥松电子 的 AHT10 / AHT20 / AHT30 / AHT40 系列温度湿度传感器。
- [github.com/hal-drv/**sc7u22**](https://github.com/hal-drv/sc7u22) : (WIP) 士兰微电子 的 SC7A20 / SC7I22 / SC7U22 系列加速度计和重力传感器。

目前主要是自己手头有的。列表还在不断增加中。欢迎在我的 [博客仓库 issues](https://github.com/kkocdko/kblog/issues) 中联系我加入组织哦～

> 20260421: 感谢提供的最新 AHT40 传感器样品（右 1），确实非常迷你呢（排针为 2.45mm）。

<img alt="real-hardware-photo" loading="lazy" width="1620" height="960" src="https://github.com/kkocdko/kblog/releases/download/simple_storage/hal-drv_aht30_1.webp">
