# webusbkvm

[简体中文](#translation-zh-cn)

An USB KVM (Keyboard Video Mouse) client in your browser.

## Why

To debug a server, we need to connect the keyboard mouse and screen. But this project allows you to control the target device and monitor the display output on an existing computer (usually a laptop) or even an Android phone, even paste commands to the TTY!

There are already USB KVM clients on the world with similar functions, but they usually only support Windows and charge a fee. This project **supports any environment with full Chromium running** (excluding Chrome for iOS, obviously), using the WebUSB/WebSerial API in browser. Open source under the MIT License.

## Usage

First you need the CH9329 module (5 ￥ chinese yuan), CH340 module (3 ￥), MS2109 capture card (18 ￥). This is much cheaper than a portable screen + mouse and keyboard.

Connect the target machine and your PC (sometimes you need `sudo chmod 777 /dev/ttyUSBn`), open <https://kkocdko.site/toy/webusbkvm> and follow the tips on page.

## By the way

MS2109 capture card maximum transmission 1080p 30fps mjpeg, if you need better quality, try MS2130 (35 ¥). But I personally don't think it's necessary, because the target machine is usually in TTY or running WinPE.

If you want a pretty look, you can buy CH9329+CH340 end product cable (15 ¥), which cost more compared to two modules and dupont cable.

## Translation

<details>
<summary id="translation-zh-cn">简体中文</summary>

> webusbkvm - 在浏览器上的 USB KVM (键盘 视频 鼠标) 客户端。

## 为什么

为了调试一台服务器，我们要接上键盘鼠标屏幕。但本项目可以在已有的电脑（通常是笔记本）甚至 Android 手机上操控目标设备和监看显示输出，还能粘贴命令到 TTY！

目前市面上已有类似功能的 USB KVM 客户端，但通常 只支持 Windows，且收费。这个项目 **借助浏览器提供的 WebUSB/WebSerial API，支持任何能够运行完整 Chromium 的环境**（显然不包括 iOS 平台的套壳 Chrome）。遵循 MIT 协议开源。

## 使用方法

首先你需要 CH9329 模块（5 ￥）、 CH340 模块（3 ￥）、MS2109 采集卡（18 ￥）。比起 便携屏+鼠标键盘 便宜多了。

连接目标设备和你的电脑（可能需要 `sudo chmod 777 /dev/ttyUSBn`），然后打开 <https://kkocdko.site/toy/webusbkvm> ，按页面指示使用即可。

## 多说几句

MS2109 采集卡最高传输 1080p 30fps mjpeg，如果你需要更高的画质，可以选择 MS2130，价格在 35 ￥左右。但是我个人觉得这是不必要的，毕竟一般目标机器都是在 TTY 里或者运行 WinPE。

如果你希望外观好看，可以购买 CH9329+CH340 的成品线（15 ￥），相对于自己买两个模块和杜邦线要贵一些。

</details>
