```
title: Change ZSTD Level in QCOW2
date: 2022.06.11 23:53
tags: Tutorial Code Linux QEMU
description: Useful for read-only disk image
```

> Currently it's QEMU 7.1.0

The zstd level of qcow2 created by qemu is always 3. For a read-only disk image, I just want the best compression ratio.

There are not a command line option, so we need to modify the source code<sup>(1)</sup>. On [./block/qcow2-threads.c](https://github.com/qemu/qemu/blob/v7.1.0/block/qcow2-threads.c#L203-L209):

```diff
  206 |     return -EIO;
  207 | }
+ 208 | ZSTD_CCtx_setParameter(cctx, ZSTD_c_compressionLevel, ZSTD_maxCLevel());
  209 | /*
```

Compiling it following [offical tutorial](https://www.qemu.org/download/) (or [prebuild binary](https://github.com/kkocdko/kblog/releases/download/0.0.5/qemu-img-zstd-extreme.zip)). Here some tips:

```sh
# (Fedora) Install dependencies
dnf install bzip2 ninja-build libzstd-devel pixman-devel
# Enable ZSTD, disable useless features for shorter compile time
./configure --enable-zstd --disable-tcg --disable-kvm
```

Now we found `qemu-img` at `./build`. Have a try?

```sh
./qemu-img convert -p -f qcow2 -O qcow2 -c -o compression_type=zstd win10.qcow2 win10-2.qcow2
```

We got it:

```
[kkocdko@fedora tmpfs]$ ls -l
total 3411264
-rw-r--r--. 1 kkocdko kkocdko 1651638272 Jun 12 01:57  win10-2.qcow2
-rw-r--r--. 1 kkocdko kkocdko 1841496064 May 25 18:21  win10.qcow2
```

> (1) You can find more zstd parameters from [docs](https://zstd.docsforge.com/dev/api/ZSTD_cParameter/).
