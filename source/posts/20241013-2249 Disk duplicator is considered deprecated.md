```
title: Disk duplicator is considered deprecated
date: 2024.10.13 22:49
tags: Opinion Deprecated
description: It's history, disadvantages and alternative
```

🌐 - [简体中文](#lang_zh-cn)

## History and usage

Hard disk duplicator is something that is not sold on Taobao, Amazon and other platforms. It actually originated from the CD duplicator and tape duplicator of the year. All you need to do is plug in, copy, and unplug.

## Cons

- Expensive, obviously not in line with the cost.

- Cannot be capacity-adaptive, must use equal/smaller capacity hard disk.

- Not partition table and file system aware, resulting in useless data writes and duplicate GPT GUIDs and file system UUIDs.

## Alternatives

- Obviously there's no need for me to go into more detail. If you're installing a computer, you can use an empty disk with a LiveCD/WinPE
- If you're really going mega, you can use a fast portable disk for writes (the JMS583 10G USB is currently 22 ￥ or 5 $), then use something like [USB KVM](https://github.com/kkocdko/kblog/tree/master/source/toys/webusbkvm) to do auto operation. The _Mechrevo_ do this, don't ask me how I know this.

- Some people will suggest using a PCIe adapter and M.2 on the motherboard and then repeatedly off-on, I'm skeptical about repeatedly turning it on and off. If you have a Thunderbolt that can transfer out of PCIe, that's also a good option, but slightly more costly.

## 🌐

<details>
<summary>简体中文</summary><p id="lang_zh-cn" style="position:relative;top:-3em"></p>

## 来历和用途

硬盘对拷机这种东西，在淘宝等电商平台上销量并不低。它其实源于当年的 CD 对拷机、磁带对拷机。只需要插入，拷贝，拔出即可。

## 缺点

- 价格昂贵，与成本明显不符。

- 不能自适应容量，必须使用相等容量/较小容量硬盘。

- 不感知分区表和文件系统，造成非必要的写入，以及 GPT GUID 和文件系统 UUID 重复。

- 无法充分利用硬盘特性，例如做 bitlocker crypt offload 配置。

- 不够灵活，无法做一些类似写入递增序列号的操作。

## 替代方案

- 显然已经不需要我多讲。如果你要装机，完全可以使用空盘与 LiveCD/WinPE。

- 如果真要超大规模部署，可以使用高速的移动硬盘来装载 LiveCD（JMS583 10G USB 当前 22 ￥），然后配合 [USB KVM](https://github.com/kkocdko/kblog/tree/master/source/toys/webusbkvm) 类似的模拟鼠标键盘来自动化，这是 _机械革命_ 他们的方案，别问我是怎么知道的。

- 有些人会建议使用 PCIe 转接的和主板上的 M.2 然后反复关机开机，我对反复开关机表示怀疑。如果你有雷电可以转出 PCIe，或许也是不错的选择，但是成本略高。

</details>
