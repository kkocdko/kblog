```
title: Right path to use new glibc on old Linux
date: 2024.06.16 03:25
tags: Note Linux
description: The easy path, best practice
```

Run a old debian:10 for our tutorial.

```sh
docker run --rm -it --net host debian:10
```

Below code run inner the container.

```sh
# apt update and install
apt update
apt install -y curl unzip busybox binutils xz-utils

# show versions
apt list --installed 2>&1 | grep -e "libstdc++6/" -e "libc6/" -e "libgcc1/"

# download a binary that needs new glibc
curl -o mp4box.zip -L https://github.com/clevert-app/clevert/releases/download/asset_mp4box_2.4.0_9165791950/linux-x64.zip
unzip mp4box.zip
./mp4box
# ./mp4box: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.34' not found (required by ./mp4box)

# you can get glibc version which is used by this elf, https://stackoverflow.com/a/73388939/
nm --dynamic --undefined-only --with-symbol-versions ./mp4box | grep GLIBC | sed -e 's#.\+@##' | sort --unique

# create an assets dir
mkdir root

# download and extract latest glibc https://packages.debian.org/sid/amd64/libc6/download
curl -o downloaded.deb -L http://ftp.debian.org/debian/pool/main/g/glibc/libc6_2.39-3.1_amd64.deb
ar x downloaded.deb data.tar.xz
tar -xf data.tar.xz -C root
rm -rf downloaded.deb data.tar.xz

# (optional) download and extract latest libgcc https://packages.debian.org/sid/amd64/libgcc-s1/download
curl -o downloaded.deb -L http://ftp.debian.org/debian/pool/main/g/gcc-14/libgcc-s1_14.1.0-1_amd64.deb
ar x downloaded.deb data.tar.xz
tar -xf data.tar.xz -C root
rm -rf downloaded.deb data.tar.xz

# (optional) download and extract latest libstdc++ https://packages.debian.org/sid/amd64/libstdc++6/download
curl -o downloaded.deb -L http://ftp.debian.org/debian/pool/main/g/gcc-14/libstdc++6_14.1.0-1_amd64.deb
ar x downloaded.deb data.tar.xz
tar -xf data.tar.xz -C root
rm -rf downloaded.deb data.tar.xz

# run with latest glibc
LD_LIBRARY_PATH=$(pwd)/root/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH ./root/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2 ./mp4box -version

# we can also use patchelf
patchelf --set-interpreter $(pwd)/root/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2 --set-rpath $(pwd)/root/usr/lib/x86_64-linux-gnu ./mp4box
./mp4box

# wrong usage, cause Segmentation fault
LD_PRELOAD=/foo/bar ./mp4box -version

# wrong usage, cause relocation error: /glibc/usr/lib/libc.so.6: symbol _dl_audit_symbind_alt version GLIBC_PRIVATE not defined in file ld-linux-x86-64.so.2 with link time reference
LD_LIBRARY_PATH=$(pwd)/root/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH ./mp4box -version
```

## Reference

- https://stackoverflow.com/a/44710599

- https://stackoverflow.com/a/55663007

- https://en.wikipedia.org/wiki/Dynamic_linker
