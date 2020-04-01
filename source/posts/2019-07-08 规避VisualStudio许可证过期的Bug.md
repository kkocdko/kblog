```
title: 规避VisualStudio许可证过期的Bug
date: 2019-07-08 11:21:48
category: Tutorial
tags: VisualStudio License Bug IDE
description: 许可证过期后，更新许可证会出错。
```

> 仅在`Visual Studio for Windows`上尝试成功，Mac版未知。
>
> 本人使用`Visual Studio Community 2019 16.1.3`。理论上，此教程也适配其他版本。
>
> 当然，你要先用微软账户登陆。没有账户另当别论。

### Introduction

![001](/res/20190708-112148-001.webp)

通常，由于长时间未使用、断网等原因，VS会提示用户“许可证过期”，这很正常。

但是在点击了“检查更新的许可证”后，会显示“我们无法下载许可证，请检查你的网络链接或代理设置”。然而事实上网络连接是没有任何问题的，微软的服务器也没有被墙。这是一个VS的Bug。

### Solution

1. 关闭 Visual Studio 。

2. 打开`开始菜单>Visual Studio Installer`。

3. 点击`[你安装的VS版本]>更多>修改`。

4. 随意增添一个组件，点击右下角`修改`。等待修改完成后，关闭 Visual Studio Installer 。
    * 尽量选择轻量的组件，例如`ClickOnce发布`。
    * 可以在右下角看到勾选前后所需磁盘空间的变化，推断出组件大小。

5. 打开 Visual Studio ，点击`右上角用户头像>账户设置>检查更新的许可证`,如果一切顺利，将会成功更新许可证（“我们已成功更新了你的许可证”）。

6. 关闭 Visual Studio ，打开 Visual Studio Installer ，去掉临时增添的组件。

### By the Way

这是一个陈旧的Bug（据记载，它在VS2013中就已存在），社区中也早就有了[有关这个Bug的反馈](https://developercommunity.visualstudio.com/content/problem/69380/unable-to-update-license-1.html)，但直至今日（20190708）仍然未能修复，在这里强烈谴责巨硬。
