```
title: Tricks for C++ Simple App Development
date: 2022.01.13 01:03
tags: Tutorial Code CPP
description: Speed up compilation and more
```

> This tutorial is not a primer guide, nor will there be much detail.
>
> My scenarios: Algorithm Learning.

## Switch to Linux

Compilers work faster on Linux most of the time, and many tools only run on Linux.

[Fedora](https://fedoraproject.org) is the distribution I'm using.

Then you should install the GCC, on Fedora it's `sudo dnf install gcc gcc-c++`. Search "Install GCC `Your Distribution`" for more.

## Use MOLD

Install [mold](https://github.com/rui314/mold), follow "Install" at `README.md`.

Although we are just writing a simple app, `mold` still made the build a little faster.

## VSCode and Clangd

Install [VSCode](https://code.visualstudio.com) for editing and [Clangd Extension](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd) for intellisense.

Clangd is much faster than Microsoft's C/C++ extension.

## Project Structure & Others

Create a folder named `hello-cpp` like this:

```
├─ build
├─ src
│  └─ main.cc
└─ utils
   ├─ ld
   └─ run.sh
```

`./utils/ld` is a link to `$(which mold)`, or you can copy executable directly.

The content of `./utils/run.sh`:

```shell
# \time -f %e \
g++ ./src/main.cc -o ./build/main -Butils -Wall -Wextra -g -fsanitize=address -fno-omit-frame-pointer
ulimit -t 1 # Avoid infinity loop
[ $? -eq 0 ] && ./build/main
# readelf -p .comment ./build/main
```

Switch `-fsanitize=address` is used to enable [AddressSanitizer](https://github.com/google/sanitizers/wiki/AddressSanitizer).

Then you can create a [build task](https://code.visualstudio.com/Docs/editor/tasks) to execute `./utils/run.sh` and bind a key shortcut.

## Include less headers

Don't include unnecessary headers. `#include <bits/stdc++.h>` caused heavily compile time, only use it when submitting to Online Judge.

## Redirect `cin`

`freopen("in.txt", "r", stdin)` must create another file. Here a more concise way:

```c++
stringstream fcin(R"(1
3
1 2 3)");
istream std::cin(fcin.rdbuf());
```
