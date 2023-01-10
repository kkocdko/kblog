```
title: Build Fedora ISO in 3 Commands
date: 2023.01.08 22:06
tags: Tutorial Code Linux Docker
description: Custom for you
```

Why? In a word, you may be not satisfied by [official build](https://getfedora.org).

- Many packages in the official build were outdated, even suffered by CVEs. Run `dnf update` in a newly installed environment will need to download a lot.

- Remove rarely used packages to reduce iso size. Add packages, change theme, tweak some settings.

- Enable more optimization to speed up livecd booting and install progress.

And there's a prebuilt [custom fedora 37 x86_64 iso](https://github.com/kkocdko/utils4fedora/releases/tag/0.2.1).

## How

As the title, we only needs 3 commands:

```sh
# sudo -i # or add sudo before every command
# setenforce 0 # if you get any errors like memory permission

# 1. clone this repo
git clone --depth=1 https://github.com/kkocdko/utils4fedora

# 2. build the docker image
docker build -t makeimage utils4fedora/makeimage

# 3. build your custom fedora iso!
docker run --network=host --privileged -v $(pwd):$(pwd) --name mkimg0 makeimage \
    $(pwd)/utils4fedora/makeimage/custom.ks $(pwd)/result \
    --make-iso --iso-only --compression zstd --compress-arg=-b --compress-arg=1M --compress-arg=-Xcompression-level --compress-arg=22
```

Then, see what's produced, `ls -lh ./result/*`. It takes 4 minutes on my machine with local mirror (make download time zero) and 15 minutes on GitHub Actions.

Using docker, easy to build and avoid most of troubles caused by environment.

## Details

Like other distros, Fedora Linux is built on top of many prebuilt packages. You can still mount a raw img file and copy files into it manually, but Fedora usually uses [lorax](https://github.com/weldr/lorax) to build the image.

Lorax builds image / tarball from kickstart file, and Fedora's offical build (including [spins](https://spins.fedoraproject.org)) uses the kickstart files in <https://pagure.io/fedora-kickstarts> .

In this project (my utils4fedora), I include these in docker image. So now you only need to write a kickstart file.

```txt
# comments

%include fedora-live-workstation.ks # based on offical workstation edition

part / --size=8192 # set image root size
%packages # modify packages
-firefox # exclude a package
htop # include a package
%end # end this session

%post # run in the image's chroot
systemctl disable dnf-makecache
%end
```

If you want an origin workstation edition, remove all lines expect of `%include fedora-live-workstation.ks`. And kickstart file has a [reference here](https://pykickstart.readthedocs.io/en/latest/kickstart-docs.html).

After that, let's see the command line switches:

```txt
# we only want iso file
--make-iso --iso-only
# use zstd compression and tweak args, result in smaller size and faster decompression
--compression zstd --compress-arg=-b --compress-arg=1M --compress-arg=-Xcompression-level --compress-arg=22
```

Every time building the image will take about 1.7 GiB of data traffic, so running a local mirror may be a good idea if you want to build multi times. I recommend a HTTP proxy caching instead of a traditional mirror which used huge disk space. Try [squid](http://www.squid-cache.org) or [my server program](https://github.com/kkocdko/ksite/tree/main/src/units/mirror). See how fast it is:

```txt
2023-01-10 07:33:55,507: Starting package installation process
2023-01-10 07:33:56,507: Downloading packages
2023-01-10 07:33:58,508: Downloading 1132 RPMs, 52.95 MiB / 1001.38 MiB (5%) done.
2023-01-10 07:34:00,509: Downloading 1132 RPMs, 959.15 MiB / 1001.38 MiB (95%) done.
2023-01-10 07:34:01,511: Preparing transaction from installation source
```

## Troubles

If you search "build fedora install iso" with Google, the first result is [this one](https://fedoraproject.org/wiki/How_to_create_a_Fedora_install_ISO_for_testing) in Fedora wiki, but it's outdated now (20230110). As a result, I wasted a lot of time.

Then I found the [osbuild](https://www.osbuild.org), a "modern" way, but has many limitations. It may be suitable for some company's IT managers.

Finally, I found the right path. [Ultramarine-Linux/build-scripts](https://github.com/Ultramarine-Linux/build-scripts), a distro based on Fedora. Their repo shows the right way to build a custom Fedora image.

> To be continue...

<!--
2023-01-09 09:10:00,804: livemedia-creator v37.8-1
2023-01-09 09:10:00,804: selinux is Disabled
2023-01-09 09:10:00,845: disk_img = /tmp/lmc/result0/lmc-disk-y0jbsz9w.img
2023-01-09 09:10:00,845: Using disk size of 4098MiB
2023-01-09 09:10:00,944: Running anaconda.
...
2023-01-09 09:13:12,408: rebuilding boot/initramfs-6.0.7-301.fc37.x86_64.img
2023-01-09 09:13:44,093: Building boot.iso
2023-01-09 09:13:44,125: running x86.tmpl
2023-01-09 09:13:48,903: Disk image erased
2023-01-09 09:13:49,685: SUMMARY
2023-01-09 09:13:49,685: -------
2023-01-09 09:13:49,686: Logs are in /fedora-kickstarts
2023-01-09 09:13:49,686: Results are in /tmp/lmc/result0

2023-01-10 07:33:55,507: Starting package installation process
2023-01-10 07:33:56,507: Downloading packages
2023-01-10 07:33:58,508: Downloading 1132 RPMs, 52.95 MiB / 1001.38 MiB (5%) done.
2023-01-10 07:34:00,509: Downloading 1132 RPMs, 959.15 MiB / 1001.38 MiB (95%) done.
2023-01-10 07:34:01,511: Preparing transaction from installation source

-->

<!--

```txt
[root@klf lmc]# time qemu-kvm -machine q35 -cpu host -smp 4 -m 2G -cdrom boot.xz.iso

real	0m23.687s
user	0m26.720s
sys	0m3.007s
[root@klf lmc]# time qemu-kvm -machine q35 -cpu host -smp 4 -m 2G -cdrom boot.xz.iso

real	0m23.718s
user	0m26.378s
sys	0m2.807s
[root@klf lmc]# time qemu-kvm -machine q35 -cpu host -smp 4 -m 2G -cdrom boot.zstd.iso

real	0m16.845s
user	0m19.251s
sys	0m2.750s
[root@klf lmc]# time qemu-kvm -machine q35 -cpu host -smp 4 -m 2G -cdrom boot.zstd.iso

real	0m16.572s
user	0m18.754s
sys	0m2.653s
[root@klf lmc]# ls -l boot.xz.iso boot.zstd.iso
-rw-r--r--. 1 root root 1093302272 Jan  9 12:48 boot.xz.iso
-rw-r--r--. 1 root root 1118179328 Jan  9 11:32 boot.zstd.iso
```

```sh
cd /tmp/lmc ; rm -rf * ; cp /home/kkocdko/misc/code/utils4fedora/makeimage/custom.test.ks .
docker kill mkimg0 ; docker rm mkimg0
docker run -it --network=host --privileged -v $(pwd):$(pwd) --name mkimg0 makeimage $(pwd)/custom.test.ks $(pwd)/result0 --make-iso --iso-only --compression zstd --compress-arg=-b --compress-arg=1M --compress-arg=-Xcompression-level --compress-arg=1

qemu-kvm -machine q35 -device qemu-xhci -device usb-tablet -cpu host -smp 4 -m 2G -cdrom /tmp/lmc/result0/boot.iso

docker cp mkimg0:/fedora-kickstarts/makeimage.ks ./mk.ks

LiveOS_rootfs

noxattrs is not bootable

docker run --network=host --privileged -v $(pwd):$(pwd) --name makeimage-0-0 -it --entrypoint /bin/bash makeimage-0

sudo docker run --network=host --privileged -v $(pwd):$(pwd) --name makeimage-0 -it --entrypoint /bin/bash makeimage

46.71 MB iwlax2xx-firmware

# --squashfs-only cause systemd-resolved failed
# --squashfs-only --anaconda-arg --compression lz4 --compress-arg=
# -processors 1
# -no-recovery -b 1M -Xdict-size 1M -Xbcj x86
# echo y | sudo docker container prune
# --env HTTP_PROXY=http://192.168.43.82/ --env HTTPS_PROXY=http://192.168.43.82/
vi /etc/docker/daemon.json

#!/bin/sh

exit

# ==============================

sudo sh -c "systemctl kill docker && rm -rf /tmp/docker && systemctl start docker"
sudo docker run --network=host --hostname docker --name makeimage --privileged=true --cap-add=SYS_ADMIN -d fedora:37 tail -f /dev/null
sudo docker exec -it makeimage bash

sudo livemedia-creator \
    --make-iso \
    --no-virt \
    --resultdir ./result \
    --ks makeimage.ks \
    --logfile livemedia-creator.log \
    --fs-label ultramarine-G-x86_64 \
    --project 'Ultramarine Linux' \
    --releasever 37 \
    --release 1.0 \
    --iso-only \
    --iso-name aa.iso

# sudo livemedia-creator --make-tar --no-virt --resultdir build/image --ks build/docker-minimal-flattened.ks --logfile build/logs/livemedia-creator.log --fs-label ultramarine-D-x86_64 --project Ultramarine Linux --releasever 37 --isfinal --release 1.0 --variant docker-minimal --image-name ultramarine-docker.tar.xz --nomacboot

# ==============================

export DOCKER_BUILDKIT=1

curl -o miniserve -L https://github.com/svenstaro/miniserve/releases/download/v0.22.0/miniserve-0.22.0-x86_64-unknown-linux-musl


```

```json
{
  "data-root": "/tmp/docker",
  "registry-mirrors": ["http://hub-mirror.c.163.com"],
  "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn/"]
}
```

## Troubleshooting

- livemedia-creator throws `Command '['losetup', ...]' returned non-zero ...`:

This is because the `/dev/loop0` was t

```sh
killall anaconda
rm -rf /var/run/anaconda.pid
rm -rf lmc-result
```

- livemedia-creator throws `Command '['unshare', ...]' returned non-zero ...`:

Just restart the container.

https://mirrors.fedoraproject.org/mirrorlist?repo=updates-released-f37&arch=x86_64
https://mirrors.fedoraproject.org/mirrorlist?repo=fedora-37&arch=x86_64
https://github.com/plougher/squashfs-tools/blob/master/USAGE

-->

<!--

## Links

```
https://bugzilla.redhat.com/show_bug.cgi?id=1135475

https://fedoraproject.org/wiki/How_to_create_a_Fedora_install_ISO_for_testing
https://koji.fedoraproject.org/koji/
https://docs.fedoraproject.org/en-US/quick-docs/creating-and-using-a-live-installation-image/#proc_creating-and-using-live-cd
https://cloud-atlas.readthedocs.io/zh_CN/latest/docker/init/docker_systemd.html#id2
https://github.com/robertdebock/docker-fedora-systemd
https://serverfault.com/questions/607769/running-systemd-inside-a-docker-container-arch-linux
https://medium.com/swlh/docker-and-systemd-381dfd7e4628
https://github.com/kheshav/dockerSystemctl/blob/master/runDocker.sh
https://hub.docker.com/r/jrei/systemd-ubuntu
https://fedoraproject.org/wiki/Livemedia-creator-_How_to_create_and_use_a_Live_CD
https://weldr.io/lorax/livemedia-creator.html
https://ask.fedoraproject.org/t/help-creating-fedora-live-cd-with-a-standard-kickstart-file/11258/13
https://fedoraproject.org/wiki/Remix
https://pykickstart.readthedocs.io/en/latest/kickstart-docs.html
https://pagure.io/fedora-kickstarts/c/879a7d74092f9d324d9488f981cab625f557d6b4?branch=main
https://ask.fedoraproject.org/t/difference-between-gnome-desktop-and-workstation-product-enviroment/1269
https://koji.fedoraproject.org/koji/taskinfo?taskID=61781551
https://github.com/minimization/content-resolver-input
https://mirrors.ustc.edu.cn/help/fedora.html
https://mirrors.tuna.tsinghua.edu.cn/help/fedora/
https://docs.docker.com/engine/reference/builder/
https://github.com/codespaces
https://koji.fedoraproject.org/koji/tasks?start=100&state=all&view=flat&method=createImage&order=-id
https://blog.sigma-star.at/post/2022/07/squashfs-erofs/
https://weldr.io/lorax/livemedia-creator.html#using-a-proxy-with-repos
https://weldr.io/lorax/image-minimizer.html
https://fedoraproject.org/wiki/Changes/OptimizeSquashFS
https://pykickstart.readthedocs.io/en/latest/kickstart-docs.html#url
https://unix.stackexchange.com/questions/103926/kickstart-copy-file-to-new-system
https://access.redhat.com/discussions/6978850
```
-->
