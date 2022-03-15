```
title: Fedora for Termux
date: 2022.03.04 23:09
tags: Note Code Linux
description: Better than termux-fedora
```

The [termux-fedora](https://github.com/nmilosev/termux-fedora) is good but not enough, items in Termux's package repo often be broken, and sometimes we haven't a good network connection. Now I provide a shell script that fit better in my scene:

```shell
pkg install proot -y
mkdir ~/fedora
cd ~/fedora
curl -o fedora.tar.xz https://mirrors.ustc.edu.cn/fedora/releases/35/Container/aarch64/images/Fedora-Container-Base-35-1.2.aarch64.tar.xz
tar xvf fedora.tar.xz --strip-components=1 --exclude json --exclude VERSION
tar xpf layer.tar
chmod +w .
rm fedora.tar.xz layer.tar
echo "nameserver 8.8.8.8" > ~/fedora/etc/resolv.conf
cat > ~/startfedora.sh <<- EOM
unset LD_PRELOAD && proot --link2symlink -0 -r ~/fedora -b /dev/ -b /sys/ -b /proc/ -b /storage/ -b $HOME -w $HOME /bin/env -i HOME=/root TERM="$TERM" LANG=$LANG PATH=/bin:/usr/bin:/sbin:/usr/sbin /bin/bash --login
EOM
chmod +x ~/startfedora.sh
```
