```
title: Multi call binary for existing projects
date: 2025.03.09 08:47
tags: Code C CPP
description: simpler
```

> What's that? Okey, [BusyBox](https://en.wikipedia.org/wiki/BusyBox) is a multi call binary, one binary as `ls`,`cat` and more.
>
> Why? Please ask the LLM for [an answer](https://g.co/gemini/share/91a15c2ea6d4).
>
> TLDR: modify each commands' entry function to export `int cmd_xxx_main(...)`, write a wrapper as new entry to call different `cmd_xxx_main` depends on `argv[0]`, finally link them together.

Some projects like libwebp were compiled into [many executabe](https://packages.debian.org/trixie/amd64/webp/filelist), here's how to **modify as little as possible** to build it into multi call binary.

First, download and extract the source tarballs:

```sh
mkdir webp
cd webp
curl -L https://github.com/webmproject/libwebp/archive/2e81017c7a345f687223086cbc177a8459a18b52.tar.gz | tar -zx --strip-components 1 # 20240901 > 1.4.0
```

Then modify the entry function name by `sed` commands:

```sh
sed -i.bak -e 's|int main(|int cmd_webpinfo_main(|' examples/webpinfo.c
sed -i.bak -e 's|int main(|int cmd_cwebp_main(|' examples/cwebp.c
sed -i.bak -e 's|int main(|int cmd_dwebp_main(|' examples/dwebp.c
```

For C++, needs `extern "C"` to keep a stable C-ABI:

```sh
sed -i.bak -e 's|int main(|extern "C" int cmd_djxl_main(|' tools/djxl_main.cc
```

Then you need a wrapper, `multicall.cc`:

```cpp
#include <stddef.h>
#include <string.h>
#include <stdio.h>
#if defined(WIN32) || defined(_WIN32)
#define PATH_SEPARATOR '\\\\'
#else
#define PATH_SEPARATOR '/'
#endif
extern "C" {
  int cmd_webpinfo_main(int argc, const char* argv[]);
  int cmd_cwebp_main(int argc, const char* argv[]);
  int cmd_dwebp_main(int argc, const char* argv[]);
}
int main(int argc, const char *argv[]) {
  for (int i = 0; argc != 0 && i != 2; i++) {
    const char *argv0 = strrchr(argv[0], PATH_SEPARATOR);
    if (argv0 == NULL) argv0 = argv[0]; else argv0++;
    if (strcmp(argv0, "webpinfo") == 0) return cmd_webpinfo_main(argc, argv);
    if (strcmp(argv0, "cwebp") == 0) return cmd_cwebp_main(argc, argv);
    if (strcmp(argv0, "dwebp") == 0) return cmd_dwebp_main(argc, argv);
    argv++;
    argc--;
  }
  puts("applets: webpinfo cwebp dwebp");
  return 0;
}
```

Because libwebp uses `cmake` and `ninja`, so here's a util function to extract ninja targets. Then, compile all targets and link them with `multicall.cc`:

```sh
export CFLAGS="-O3 -fomit-frame-pointer -march=x86-64-v3 -flto"
export CXXFLAGS="$CFLAGS"

rm -rf build

# cmake will use CFLAGS/CXXFLAGS from environment
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DWEBP_USE_THREAD=OFF -DWEBP_UNICODE=OFF

# extract path of targets
ninja_targets(){
  cat build/build.ninja | grep $1 | sed -e 's|\$||g' -e 's/|/ /g' | cut -d " " -f 4- | tr " " "\n" | grep -E "\.[^\\/]+$" # get targets built by $1, fix msys2 paths like "D$:/a.o", remove target head and '|' char, exclude targets without extension name
}
webp_targets=""
webp_targets="$webp_targets $(ninja_targets C_EXECUTABLE_LINKER__webpinfo_Release)"
webp_targets="$webp_targets $(ninja_targets C_EXECUTABLE_LINKER__cwebp_Release)"
webp_targets="$webp_targets $(ninja_targets C_EXECUTABLE_LINKER__dwebp_Release)"
ninja -C build $webp_targets

g++ $CXXFLAGS multicall.cc \
  $(realpath $webp_targets) \
  -o zcodecs
```

> Full runnable build script is [here](https://github.com/clevert-app/clevert/blob/master/.github/workflows/asset_zcodecs.yml) (ect + libjxl + libwebp).
>
> As I described [here](https://stackoverflow.com/q/78911061), we can also use `objcopy` or modify the LLVM IR to rename symbols, however
