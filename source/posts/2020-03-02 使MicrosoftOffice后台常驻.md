```
title: 使MicrosoftOffice后台常驻
date: 2020-03-02 09:00:52
category: Code
tags: Office C Background Windows WinAPI
description: 加快启动速度
```

### GitHub

<https://github.com/kkocdko/mobp>

### Instruction

> `mobp`是`Microsoft Office Background Process`的缩写。

Microsoft Office 2016对于硬盘慢的电脑似乎不是很友好，启动需要很长时间。

所以我就整了这么个玩意儿，让Office在后台常驻，加快启动速度。当然，占一点内存。

> 此程序的最初版本是本人初中时用C#写的，在学校讲台的电脑上运行，效果还行。之后有人在知乎上提问，于是本人将此程序开源。

### Update History

#### 20200302

* 使用C重写。

* 通过WinAPI修改窗口属性达到隐藏效果，一劳永逸，**无需额外的辅助进程**。

* 上传到GitHub。今后更新日志请到GitHub查看。

* 强烈建议仍在使用旧版的同志们更新到新版。

#### 20180726

* 再次精简代码（编译后应该没啥变化）（未更新Release）。

#### 20180720

* 精简代码（未更新Release）。

#### 20180720

* 改用多线程写法，节省CPU时间。

#### 20180602

* 增加显示日志的功能。

#### 20180524

* 首个版本。
