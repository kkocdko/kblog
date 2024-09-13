```
title: Summary of window state restore on desktop
date: 2024.09.16 17:47
tags: Note Windows Linux Electron
description: Restore what? Where to store? Cautions? It's all here!
```

🌐 - [简体中文](#translation-zh-cn)

> This note is a conclusion description of the group chat yesterday. Includes [Chuyu-Team](https://github.com/Chuyu-Team/) members and me and more anonymous people. Thanks!

## Restore?

If your app is generic, it's usually recommended to store and restore the window state. If your application is something like Game Launcher and Login Dialog, etc. which is a fixed size, then it's recommended to be placed in the center.

## Restore what?

Referring to popular apps and os, we recommend always restore the size `(width,height)` as the best practice. You'd better remember to restore the "maximized" state.

To go further, you can also store the scale factor and reset the size if you notice a scale/resolution change. Of course you can also do sophisticated calculations to make the app keep a reasonable size even after the scale change, but I don't think this is reliable or standard practice.

However there are many details to consider when restore the window position `(x,y)`.

For all platforms, does the position of the new window opening cover the smaller windows of other apps? In desktop such as windows, system will automatically set a "reasonable" position if it's not specified, usually a little to the right down of the currently focused window, so new window appears nicely and allows the previous window to still be adjustable by dragging the title bar.

For Windows, should we exclude [Snap Windows](https://support.microsoft.com/en-us/windows/snap-your-windows-885a9b1e-a983-a3b1-16cd-c531795e6241) (left-right/quad split screen) from the position store (Explorer excluded, Chromium, QQ, etc. not)? In Win11, normal windows have rounded corners, but Snap Windows use square corners! If you don't exclude Snap Windows when store and restore, you will have the problem: restore as a normal unsplit window. Not only the straight corner rounding issue, but also the shortcut adjustment of neighboring windows, as well as the auto Snap Windows fill, will not work. So it's an window with Snap Windows' position and size, but not functions, make the user confused.

On windows, some apps will use the new WinAPI to support Snap Windows (some of which are still undocumented), but have you noticed, this is the trap! Back in the days of Win7, Snap Windows only supported left/right split, which caused some apps to store and restore to the basic left/right split after being switched to quad split, three split, or more complex states on Win10, Win11! This is completely wrong, even worse than not restore, so weird.

On GNOME, most GNOME apps have size restore,but not position restore.

Multi-monitor support has been the massive problem for all platforms, and if you store a position, it's best to judge whether it causes the window part to appear outside the monitor? Does it cause the coordinates to be negative (although allowed under windows, but not recommended)?

Also, if the position is restored, is the monitor the window is on when it opens, the one the user wants? I'm not a dual-monitors user, but I've observed that they often run into the situation where they click on an icon on monitor A, and the window appears on monitor B, and they have to drag it back. Of course, desktop environments have a tricky way around this problem by only showing the taskbar, dock, or whatever on the primary monitor, which ensures that you can only click on an icon to launch an application on the primary monitor, and then, to launch the application only on the primary monitor, you just need to eliminate the need to memorize the location of the window on the secondary monitor... So why not just drop the store?

More and more people are using cross-platform GUI these days, but much of the above requires native code to provide support. This would be a disaster for most mediocre app development teams, I'm afraid, and how do you anticipate that more relevant features will be added to the desktop environment afterwards? Will your old apps look so out of place in the new environment that the user experience is not as good as not adapting?

To summarize, here I give the simplest, robust, but not full featured approach: **Restore window size, reset after scaling or resolution change, restore maximized state, no restore window position and split-screen state**.

## Where to store?

Most projects writes to a config file and reads it at startup. For example https://github.com/mawie81/electron-window-state . Some projects under Linux write to dconf, some projects under windows use the Registry, but if we look at it from a cross-platform point of view, it's probably safer and more consistent to use a config file instead of windows registry / Linux dconf. Besides, some Linux desktop environments don't have dconf.

## Translation

<details>
<summary id="translation-zh-cn">简体中文</summary>

## 是否恢复？

如果应用比较普通，通常建议记忆和恢复窗口状态。如果你的应用是类似于“游戏启动器”，“登录对话框”这样的固定大小的东西，那么建议将窗口居中。

## 恢复些什么？

参考了多个系统和多个应用后，我建议始终记忆窗口尺寸 `(width,height)`，这是通行做法。同时，你最好记忆和恢复一下最大化状态。

如果想更进一步，还可以存储用户的缩放配置，如果发现缩放改变，就重置尺寸。当然你也可以通过精密的计算来使得更改缩放后应用也能以合理尺寸显示，但我认为这是不可靠的，也不标准的做法。

窗口位置 `(x,y)` 的记忆有诸多细节需要考虑。

对于所有平台，窗口打开的位置会否盖住其他应用的更小窗口？在 Windows 等桌面环境中，如果未指定新窗口位置，系统将自动给出一个“合理”的位置，通常是当前聚焦窗口右下一点的位置。这个位置能让新窗口在合适的视觉范围内出现，又可以让上一个窗口依然能被拖动标题栏来进一步调整。

对于 Windows，是否要在位置记忆中排除左右/四角分屏的数据（Explorer 排除了，Chromium，QQ 等没有排除）？在 Win11 中，普通窗口带有圆角，但分屏窗口使用直角。若记忆和恢复时不排除分屏，就会出现恢复后被识别为普通的未分屏窗口的问题。不仅是直角圆角问题，还有分屏时相邻窗口的快捷调整，以及自动分屏填充，都将无法使用，你的窗口会变成一个系统认为不分屏的，却又看起来是分屏的窗口，让用户感到困惑。

在 Windows 上，有些应用会使用新增的 WinAPI 来支持记忆 Snap Windows（其中有些还是 undocument 的），但你发现了吗，这是个坑！在 Win7 的年代，Snap Windows 只支持左右二分，这导致有些应用在 Win10, Win11 上被切换为四角、三分或更复杂的状态后，记忆并恢复到了基础的左右二分的状态！这是完全错误的，比不恢复还糟糕，简直是无厘头。

在 GNOME 上，大多数 GNOME 配套应用有尺寸记忆，没有位置记忆。

对于各个平台，多显示器支持一直是老大难问题，如果你记忆了一个位置，最好判断一下，它是否会导致窗口部分出现在显示器之外？是否会导致坐标负数（虽然在 Windows 下是允许的，但不建议）？

另外，如果记忆了位置，那么窗口打开时所在的屏幕，是用户想要的那个屏幕吗？虽然我不是双屏用户，但我观察到他们经常碰到“在显示器 A 上点击图标，窗口却在显示器 B 上出现，又要拽回来”的情况。当然，对于这个问题，桌面环境有一种投机取巧的规避方法，就是只在主显示器上显示任务栏、Dock 或者别的什么东西，这确保了你只能在主显示器上点击图标来启动应用，之后，为了让应用只在主显示器上启动，你只需要排除一下对副显示器的窗口位置记忆……那么为什么不直接放弃记忆呢？

现在越来越多人使用跨平台 GUI 技术，但上述的许多内容，都需要原生代码提供支持。这对于大多数平庸的应用开发团队恐怕是个灾难，而且，你如何预料之后的桌面环境会否增加更多相关功能？你的旧版应用在新的环境中会否显得格格不入，以至于用户体验还不如不适配好？

总结一下，在这里，我给出最简单，健壮，但不 full featured 的做法：**记忆窗口尺寸，在缩放或分辨率改变后重置，记忆最大化状态，不记忆窗口位置和分屏状态**。

https://support.microsoft.com/en-us/windows/snap-your-windows-885a9b1e-a983-a3b1-16cd-c531795e6241

## 记忆到哪？

大多数项目采用写入配置文件，在启动时读取的方案。例如 https://github.com/mawie81/electron-window-state 。Linux 下有些项目写入 dconf，windows 下有些项目使用注册表，但是我们如果从跨平台的角度来说，使用配置文件可能是更稳妥也更统一的选择，而不是 windows 注册表 / Linux dconf。况且有些 Linux 桌面环境也没有 dconf。

</details>
