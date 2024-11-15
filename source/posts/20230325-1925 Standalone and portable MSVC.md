```
title: Standalone and portable MSVC
date: 2023.03.25 19:25
tags: Note C CPP
description: For testing, CI and more
```

🌐 - [简体中文](#translation-zh-cn)

This is the standalone MSVC pack in a 7z file. Thanks to [portable-msvc.py - mmozeiko - GitHub Gist](https://gist.github.com/mmozeiko/7f3162ec2988e81e56d5c4e22cde9977).

If you are doubtful about the security of the files provided here, you can generate the same content yourself using GitHub Actions.

[OneDrive](https://1drv.ms/f/s!AndLPYbx5v06kje4A6kjWsThDDBi?e=yH89ou) | [123 Pan](https://www.123pan.com/s/SfI0Vv-u1khd.html) | [Baidu Pan](https://pan.baidu.com/s/1PO0JyoSV8J4ix7QDnTu2qA?pwd=s9nc)

```
date = 2023.03.24
host = target = x64
name = msvc_19.35.32216.1_x64_from_vs2022.7z
crc32 = 781e5ace
size = 104914009 bytes
cl.exe = 19.35.32216.1
link.exe = 14.35.32216.1
nmake.exe = 14.35.32216.1
msbuild.exe = no included
windows sdk = 10.0.22621.0
```

## Pros

- Lightweight. x86_64 only and 100+ MiB package size. Offical VS Build Tools included many arch's cross compiler, with 1.9 GiB package and about 8 GiB expanded size.

- Less limitation. Offical VS Build Tools force you to have .NET runtime, will cause many problems in special environment.

## Cons

- No MSBuild included.

## Translation

<details>
<summary id="translation-zh-cn">简体中文</summary>

这是一个包含了独立版本 MSVC 的 7z 压缩包。感谢 [portable-msvc.py - mmozeiko - GitHub Gist](https://gist.github.com/mmozeiko/7f3162ec2988e81e56d5c4e22cde9977)。

如果你对这里提供的文件的安全性有疑问，可以使用 GitHub Actions 生成相同内容。

[OneDrive](https://1drv.ms/f/s!AndLPYbx5v06kje4A6kjWsThDDBi?e=yH89ou) | [123 盘](https://www.123pan.com/s/SfI0Vv-u1khd.html) | [百度网盘](https://pan.baidu.com/s/1PO0JyoSV8J4ix7QDnTu2qA?pwd=s9nc)

```
date = 2023.03.24
host = target = x64
name = msvc_19.35.32216.1_x64_from_vs2022.7z
crc32 = 781e5ace
size = 104914009 bytes
cl.exe = 19.35.32216.1
link.exe = 14.35.32216.1
nmake.exe = 14.35.32216.1
msbuild.exe = no included
windows sdk = 10.0.22621.0
```

## 优势

- 轻量。仅包含 x86_64，压缩包体积仅有 100+ MiB，原版 VS Build Tools 包含了各种架构的交叉编译工具链，包体积需要 1.9 GiB，展开后约 8 GiB。

- 限制少。原版 VS Build Tools 要求系统中必须安装有符合条件的 .NET 运行时，在特殊环境下会遇到各种问题。

## 缺点

- 不包含 MSBuild。

</details>
