```
title: 规避 Visual Studio 许可证过期的 Bug
date: 2019.07.08 11:21
tags: Tutorial VisualStudio Code
description: 许可证过期后，更新许可证会出错
```

> 仅在 `Visual Studio for Windows` 上尝试成功，Mac 版未知。
>
> 本人使用 `Visual Studio Community 2019 16.1.3`。理论上，此教程也适配其他版本。
>
> 当然，你要先用微软账户登陆。没有账户另当别论。

## Introduction

<img src="/res/20190708-1121-001.webp" width="655" height="435">

通常，由于长时间未使用、断网等原因，VS 会提示用户“许可证过期”，这很正常。

但是在点击了“检查更新的许可证”后，会显示“我们无法下载许可证，请检查你的网络链接或代理设置”。然而事实上网络连接是没有任何问题的，微软的服务器也没有被墙。这是 VS 的一个 Bug。

## Solution

1. 关闭 Visual Studio。

2. 从开始菜单打开 Visual Studio Installer。

3. 点击 你安装的版本 > 更多 > 修改。

4. 随意增添一个组件，点击右下角 `修改`。等待修改完成后，关闭 Visual Studio Installer 。

   - 尽量选择轻量的组件，例如“ClickOnce 发布”。
   - 可以在右下角看到勾选前后所需磁盘空间的变化，推断出组件大小。

5. 打开 Visual Studio ，点击 右上角用户头像 > 账户设置 > 检查更新的许可证,如果一切顺利，将会成功更新许可证（“我们已成功更新了你的许可证”）。

6. 关闭 Visual Studio ，打开 Visual Studio Installer ，去掉临时增添的组件。

## By the Way

这是一个陈旧的 Bug（据记载，它在 VS2013 中就已存在），社区中也早就有了 [有关这个 Bug 的反馈](https://developercommunity.visualstudio.com/content/problem/69380/unable-to-update-license-1.html)，但直至今日（20190708）仍然未能修复，在这里强烈谴责巨硬。
