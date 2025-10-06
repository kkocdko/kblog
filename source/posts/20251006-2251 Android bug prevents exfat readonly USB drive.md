```
title: Android bug prevents exfat readonly USB drive
date: 2025.10.06 22:51
tags: Linux Android Code
description: Bug inside fsck handling logic
```

> I will report this bug later and update this article.

The bug: some USB drive has a hardware readonly switch. Format it as exfat filesystem on PC, unplug, switch to readonly, plug into Android phone (known as OTG), then Android shows a notification: external storage is broken. Use fat32 with readonly switch enabled is normal.

It's because Android will run fsck for any plugged external storage, and only mount when fsck passes. The logic for fat32 considered the readonly situation, but exfat does not. See AOSP:

- https://android.googlesource.com/platform/system/vold/+/5caf840c13bf9939fbfa3ae12e8d8523d349ca78/fs/Exfat.cpp#37

- https://android.googlesource.com/platform/system/vold/+/5caf840c13bf9939fbfa3ae12e8d8523d349ca78/Utils.cpp#1103

An interesting thing: I tested Lineage (Android 15) and Xiaomi HyperOS, both exhibiting this issue. However, some Chinese phones like OPPO (run ColorOS) worked fine — perhaps they have discovered this issue, or even removed fsck entirely?

If you have root permission in your phone, you can replace exfat fsck with a dummy executable to workaround this bug.

> And, don't ask me why I need the hardware readonly switch. It just exists.

## More info

- https://wiki.gentoo.org/wiki/ExFAT#Compatibility_with_macOS

- https://t.me/c/1026262135/1406836

- https://t.me/c/1026262135/1412272

<details>
<summary>Origin chat history backup</summary>

```txt
kkocdko, [2025/8/5 20:01]

我发现我的 android 手机（连接 U 盘的时候）似乎不支持 exfat，有什么头绪么。我记得几年前 exfat 在 android 就有支持了吧

android 14, lineage 21, kernel 5.10

kkocdko, [2025/8/5 20:01]
系统是 gsi，但是 内核是红米 k50pro 原厂内核 (从 hyperOS 偷的)，不是 gki

𝙠❌❎𝙩 🪄, [2025/8/5 20:13]
可以检查一下下面的条件
https://android.googlesource.com/platform/system/vold/+/11760521a2e86389c56620ec50e780e8b17e40ca/fs/Exfat.cpp#37
https://android.googlesource.com/platform/system/vold/+/11760521a2e86389c56620ec50e780e8b17e40ca/Utils.cpp#1103

kkocdko, [2025/8/5 20:24]
/dev/block/loop43: UUID="7d1522e1-9dfa-5edb-a43e-98e3a4d20250" TYPE="ext4"
/dev/block/zram0: UUID="544a6ba7-d571-4c32-aefe-d506c7e6d1a8" TYPE="swap"
/dev/block/loop44: UUID="4dd65953-f87a-41a8-afb4-1c398c007c61" TYPE="ext4"
/dev/block/sdd1: LABEL="KK_MAIN" UUID="8E79-6C18" TYPE="exfat"
/dev/block/sdd2: SEC_TYPE="msdos" LABEL="VTOYEFI" UUID="7353-81B1" TYPE="vfat"
:/data/adb/ksu/bin # cd ..
:/data/adb/ksu # cd ..
:/data/adb # mkdir misc
:/data/adb # cd misc
:/data/adb/misc # ls
:/data/adb/misc # mkdir sdd1
:/data/adb/misc # mount /dev/block/sdd1 sdd1
'/dev/block/sdd1' is read-only
:/data/adb/misc # cd sdd1
:/data/adb/misc/sdd1 # ls
Android  Movies  Music  Pictures  misc  ventoy
:/data/adb/misc/sdd1 #

kkocdko, [2025/8/5 20:24]
我直接进去 mount 能用（read only 是我开了写保护很正常）（另一片 fat32 的也是写保护，能正常被 android 识别）

...


kkocdko, [2025/8/25 17:35]
迟到的回复。

我检查了下，它会在挂载前 fsck，如果 fsck 错误则说损坏。而 fsck.exfat -y 对于 read-only 的块设备会返回非 0，因此无法挂载。我测试了 lineage （android 15），小米 hyperos，均有此问题。但是，我测试了 ColorOS，居然能正常使用，或许它们注意到了这个问题，甚至，它们可能直接移除了 fsck？

另外，在 Mount 函数 里有针对 readonly 的处理，表明 google 的人可能希望支持 readonly，只是没处理好。

kkocdko, [2025/8/25 17:35]
目前个人贡献 aosp 还有戏么，或者，直接反馈一下拉倒（

Miao Wang, [2025/8/25 17:36]
readonly？

Miao Wang, [2025/8/25 17:36]
没太懂，你插上去的设备是 readonly 的？

kkocdko, [2025/8/25 17:36]
u 盘、读卡器上的写保护开关

Miao Wang, [2025/8/25 17:38]
所以说你关掉写保护之后就能识别了？

kkocdko, [2025/8/25 17:38]
是的

Miao Wang, [2025/8/25 17:38]
唔

kkocdko, [2025/8/25 17:38]
我当时没注意到这一点，以为都不能用

Miao Wang, [2025/8/25 17:38]
那确实是 bug

𝙠❌❎𝙩 🪄, [2025/8/25 18:06]
应该还有戏
```

</details>
