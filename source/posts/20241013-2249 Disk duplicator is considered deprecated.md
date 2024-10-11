```
title: Disk duplicator is considered deprecated
date: 2024.10.13 22:49
tags: Opinion Deprecated
description: It's history, disadvantages and alternative
```

🌐 - [简体中文](#translation-zh-cn)

## History and usage

Hard disk duplicator is something that is not sold on Taobao, Amazon and other platforms. It actually originated from the CD duplicator and tape duplicator of the year. All you need to do is plug in, copy, and unplug.

## Cons

- Expensive, obviously not in line with the cost.

- Cannot be capacity-adaptive, must use equal/smaller capacity hard disk.

- Not partition table and file system aware, resulting in useless data writes and duplicate GPT GUIDs and file system UUIDs.

## Alternatives

Obviously there's no need for me to go into more detail. If you're installing a computer, you can use an empty disk with a LiveCD, and if you're really going mega, you can use a USB to M.2 adapter for writes (the JMS583 10G USB adapter that is currently 22 ￥ or 4 $). Some people will suggest using a PCIe adapter and M.2 on the motherboard and then repeatedly off-on, I'm skeptical about repeatedly turning it on and off. If you have a Thunderbolt that can transfer out of PCIe, that's also a good option, but slightly more costly.

## Translation

<details>
<summary id="translation-zh-cn">简体中文</summary>

## 来历和用途

硬盘对拷机这种东西，在淘宝等电商平台上销量并不低。它其实源于当年的 CD 对拷机、磁带对拷机。只需要插入，拷贝，拔出即可。

## 缺点

- 价格昂贵，与成本明显不符。

- 不能自适应容量，必须使用相等容量/较小容量硬盘。

- 不感知分区表和文件系统，造成非必要的写入，以及 GPT GUID 和文件系统 UUID 重复。

## 替代方案

显然已经不需要我多讲。如果你要装机，完全可以使用空盘与 LiveCD。如果真的要超大规模部署，可以使用 USB 转 M.2 来写入（JMS583 方案的 10G USB 转接当前 22 ￥）。有些人会建议使用 PCIe 转接的和主板上的 M.2 然后反复关机开机，我对反复开关机表示怀疑。如果你有雷电可以转出 PCIe，也是不错的选择，但是成本略高。

</details>
