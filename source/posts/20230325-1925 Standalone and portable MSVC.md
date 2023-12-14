```
title: Standalone and portable MSVC
date: 2023.03.25 19:25
tags: Note C CPP
description: For testing, CI and more
```

> I18N: English | [简体中文](/./post/202303251926)

This is the standalone MSVC pack in a 7z file. Thanks to [portable-msvc.py - mmozeiko - GitHub Gist](https://gist.github.com/mmozeiko/7f3162ec2988e81e56d5c4e22cde9977).

If you are doubtful about the security of the files provided here, you can generate the same content yourself using GitHub Actions.

[OneDrive](https://onedrive.live.com/?authkey=%21AHAhKEAw%2DEg5PvU&id=3AFDE6F1863D4B77%212359&cid=3AFDE6F1863D4B77) | [123 Pan](https://www.123pan.com/s/SfI0Vv-u1khd.html) | [Baidu Pan](https://pan.baidu.com/s/1PO0JyoSV8J4ix7QDnTu2qA?pwd=s9nc)

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
