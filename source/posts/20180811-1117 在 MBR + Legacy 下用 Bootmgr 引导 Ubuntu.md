```
title: 在 MBR + Legacy 下用 Bootmgr 引导 Ubuntu
date: 2018.08.11 11:17
tags: Ubuntu Linux
description: 标题已经说得够清楚了
```

> 适用于 MBR + Legacy，UEFI 未尝试。

> Win10 + Ubuntu，Win10 在分区索引 0。

## Steps

如果硬盘上的引导程序不是 Grub，或者不能引导 Ubuntu，保险起见，请先修复 Grub。

```sh
sudo add-apt-repository ppa:yannubuntu/boot-repair
sudo apt-get update
sudo apt-get install -y boot-repair
boot-repair
```

安装 EasyBCD，在左侧栏点击 `BCD Deployment`,在右侧 MBR Configuration Options 里边选择 `...Windows Vista/7...`，然后点击 `Write MBR`，覆盖 Grub。

在左侧的 GroupBox 里边点击 `Add New Entry`，选择 `Linux/BSD` 这个标签，`Type` 选择 `GRUB (Legacy)`（不要选 Grub2），`Drive` 选择安装 Ubuntu 的驱动器，`Name` 随便填。然后点击 `Add Entry`，重启即可。

## By the Way

可以用 `sudo gedit /etc/default/grub` 修改 Grub 配置（例如超时时间）（任意文本编辑器均可），最后别忘了 `sudo update-grub`。
