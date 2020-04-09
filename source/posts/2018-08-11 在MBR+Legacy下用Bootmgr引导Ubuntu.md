```
title: 在MBR+Legacy下用Bootmgr引导Ubuntu
date: 2018-08-11 11:17:50
category: Note
tags: Ubuntu Linux Boot Windows
description: 标题已经说得够清楚了
```

> 适用于MBR+Legacy，UEFI未尝试。

> Win10+Ubuntu，Win10在分区索引0。

### Step

#### Step 1

如果硬盘上的引导程序不是Grub，或者不能引导Ubuntu，保险起见，请先修复Grub。

```sh
sudo add-apt-repository ppa:yannubuntu/boot-repair
sudo apt-get update
sudo apt-get install -y boot-repair
boot-repair
```

* 保证联网，否则请预先下载deb包。

#### Step 2

安装EasyBCD，在左侧的GroupBox里边点击`BCD Deployment`,在右侧的MBR Configuration Options这个GroupBox里边选择`...Windows Vista/7...`，然后点击`Write MBR`，覆盖Grub。

#### Step 3

在左侧的GroupBox里边点击`Add New Entry`，选择`Linux/BSD`这个Tab，`Type`选择`GRUB (Legacy)`（不要选Grub2），`Drive`选择安装Ubuntu的驱动器，`Name`随便填。然后点击`Add Entry`，重启即可。

### By the Way

可以用`sudo gedit /etc/default/grub`修改Grub配置（例如超时时间）（任意文本编辑器均可），最后别忘了`sudo update-grub`。
