```
title: Change ZSTD Level in QCOW2
date: 2022.06.11 23:53
tags: Tutorial Code Linux QEMU
description: Useful for read-only disk image
```

> Currently it's QEMU `8.2.0`

The zstd level of qcow2 created by qemu is always 3. For a read-only disk image, I just want the best compression ratio.

There are not a command line option, so we need to modify the source code<sup>(1)</sup>. On [./block/qcow2-threads.c](https://github.com/qemu/qemu/blob/v8.2.0/block/qcow2-threads.c#L224-L226):

```
  224 |  */
+     | ZSTD_CCtx_setParameter(cctx, ZSTD_c_strategy, ZSTD_btultra2);
+     | ZSTD_CCtx_setParameter(cctx, ZSTD_c_compressionLevel, ZSTD_maxCLevel());
+     | ZSTD_CCtx_setParameter(cctx, ZSTD_c_enableLongDistanceMatching, 1);
  225 | zstd_ret = ZSTD_compressStream2(cctx, &output, &input, ZSTD_e_end);
```

Compiling by yourself or use my [prebuilt binary](https://github.com/kkocdko/kblog/releases/download/simple_storage/qemu-img-zstd-x.zip) (built [on GitHub Actions](https://github.com/kkocdko/utils4linux/blob/master/.github/workflows/qemu-img.yml)).

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

> (1) You can find more zstd parameters from [docs](https://facebook.github.io/zstd/zstd_manual.html).
