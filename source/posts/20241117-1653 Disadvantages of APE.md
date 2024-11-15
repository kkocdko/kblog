```
title: Disadvantages of APE
date: 2024.11.17 16:53
tags: Linux Opinion Code
description: APE / Actually Portable Executable / Cosmopolitan Libc
```

[Cosmopolitan](https://github.com/jart/cosmopolitan), it can build an APE(Actually Portable Executable) that runs in Windows, Linux, and macOS directly. By some hacky way like using MZ [magic bytes](https://en.wikipedia.org/wiki/List_of_file_signatures) and running shell script to redirect execution in Unix platforms.

Many people show me this project's advantages, but no one shows its disadvantages. Here's what I found:

- Lack the support of LTO, PGO, and BOLT, even more, the PGO and BOLT are not fixable in the foreseeable future. Different platform has different profiling results and hotspots, PGO will generate different asm for them, and this needs complex dynamic dispatch.

- Not standard, without guarantees. You will hit many bugs, and the hacky way may lack support in newer versions of each platform if they add more strict checks to executables.

- It creates many uncommon PE sections, in my Windows 11 VM, the Windows Defender keeps killing it.

- As another way, to reduce the size, just compile each platform's binary and then compress them together by 7z/LZMA, it has many stable and effective ways to compress similar executables, like BCJ filters.

In a word, APE is fantastic, however, it has many disadvantages and will not be the popular way to ship binaries to users. Use by your case, please.
