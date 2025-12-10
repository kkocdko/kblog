```
title: Reduce memory usage of FreeCAD and OrcaSlicer
date: 2025.11.03 22:29
tags: Linux CAD CAM
description: Some tricks
```

## FreeCAD

Main idea: Qt PySide compiles and embed QRC into huge `xxx_rc.py`, I dump data as bin file and use `open()`.

And there's more you can strip, on my debian 13 these runs well.

```sh
curl -o FreeCAD.AppImage -L https://github.com/FreeCAD/FreeCAD/releases/download/1.1rc1/FreeCAD_1.1rc1-Linux-x86_64-py311.AppImage
chmod +x FreeCAD.AppImage
./FreeCAD.AppImage --appimage-extract
mv squashfs-root FreeCAD
cd FreeCAD
pushd usr ; rm -rf man fonts ssl ; popd
pushd usr/share ; rm -rf doc icons man mysql opencv4 ; popd
pushd usr/lib ; rm -rf qt6/bin qt6/plugins/qmlls qt6/qml/QtQuick libQt6Quick* $(ls | grep -E "^(lib)?(LLVM|clang|openvino|avcodec|rav1e|dav1d|avif|x265|x264|aom|SvtAv1Enc|opencv|mysqlclient|pcl|proto(buf|c)|gtk)[\._-]") ; popd # vtk is used by mesh
pushd usr/lib/python3.11 ; rm -rf ensurepip ; popd
pushd usr/lib/python3.11/site-packages ; rm -rf OCC pandas scipy debugpy ifcopenshell pip ; popd
for entry in $(find -name "*_rc.py"); do
  suffix="$(tail -n 8 $entry | tr "\n" "|")"
  (tail -n +8 $entry | head -n -8 ; printf "with open(__file__+'.qrc_name.bin','wb')as f:\n    f.write(qt_resource_name)\nwith open(__file__+'.qrc_struct.bin','wb')as f:\n    f.write(qt_resource_struct)\nwith open(__file__+'.qrc_data.bin','wb')as f:\n    f.write(qt_resource_data)\nexit()") > $entry.tmp
  mv $entry.tmp $entry
  usr/bin/python $entry
  (printf "from PySide6 import QtCore\nwith open(__file__+'.qrc_name.bin','rb')as f:\n    qt_resource_name=f.read()\nwith open(__file__+'.qrc_struct.bin','rb')as f:\n    qt_resource_struct=f.read()\nwith open(__file__+'.qrc_data.bin','rb')as f:\n    qt_resource_data=f.read()\n" ; echo "$suffix" | tr "|" "\n") > $entry
done
# Menu > Edit > Preferences > Display > Use OpenGL VBO
# Wayland: https://github.com/FreeCAD/FreeCAD/issues/6068
# tar -c FreeCAD | xz -T2 -9e --block-size $(( $(tar -c FreeCAD | wc -c) / 2 + 64 )) > FreeCAD.tar.xz # see mkdebian, todo: a new post for 2 block xz
```

Before (left) and after (right):

![Screenshot to compare memory usage](https://github.com/user-attachments/assets/e3ad2e77-9a59-4e48-b0c9-5f479e751ad6)

## OrcaSlicer

The custom font and homepage webview use lots of memory.

```sh
curl -o OrcaSlicer.AppImage -L https://github.com/SoftFever/OrcaSlicer/releases/download/v2.3.1/OrcaSlicer_Linux_AppImage_Ubuntu2404_V2.3.1.AppImage
chmod +x OrcaSlicer.AppImage
./OrcaSlicer.AppImage --appimage-extract
apt install --no-install-recommends libwebkit2gtk-4.1-0 # for debian 13
# reduce memory usage a lot
mv resources/fonts resources/fonts.bak
mv resources/web/homepage/index.html resources/web/homepage/index.html.bak
echo '<!doctype html><html style="background:#000"><script>window.close()</script>' > resources/web/homepage/index.html
# force enable dark mode
export GTK_THEME=adw-gtk3-dark
export ORCA_SLICER_DARK_THEME=true
# kill webkit processes
(nohup sh -c 'sleep 3 ; kill $(pgrep -P $(pgrep orcaslicer_main))' > /dev/null 2>&1 &)
```

<!--

25.5mm

- print_creality_12m15s.gcode = 创想三维软件，默认 CR-PLA 改风扇，层高 0.16 速度 25 60
- print_orca_silk_14m13s.gcode = 使用 orca slicer 切片，使用 silk PLA 预设，层高 0.16 速度 25 60

- https://m.youtube.com/playlist?list=PLvYFiDTG74hrGN8h51IQZte2KRc4TnZep
- https://www.bilibili.com/opus/918970285204439041
- https://github.com/CrealityOfficial/CrealityPrint/blob/master/resources/profiles/Creality/filament/CR-PLA%20%40Creality%20Ender-3%20V3%20KE%200.4%20nozzle.json
- https://github.com/SoftFever/OrcaSlicer/wiki/Calibration
- https://wiki.bambulab.com/zh/filament-acc/filament/print-quality/stringing-oozing

Content of file `（加强支撑）0.20mm Standard @Creality Ender-3 V3 KE 0.4 nozzle -.json` :

```json
{
  "base_id": "GP004",
  "bottom_shell_layers": "5",
  "enable_support": "1",
  "from": "User",
  "inherits": "0.20mm Standard @Creality Ender-3 V3 KE 0.4 nozzle",
  "is_custom_defined": "0",
  "name": "（加强支撑）0.20mm Standard @Creality Ender-3 V3 KE 0.4 nozzle -",
  "print_settings_id": "（加强支撑）0.20mm Standard @Creality Ender-3 V3 KE 0.4 nozzle -",
  "support_base_pattern": "rectilinear-grid",
  "support_interface_spacing": "0.2",
  "support_interface_top_layers": "3",
  "support_top_z_distance": "0.1",
  "support_type": "tree(auto)",
  "version": "25.8.30.15",
  "wall_loops": "3"
}
```

Old gcode?

```
tail_len=565 ; diff -W 200 -y <(tail -n$tail_len /media/kkocdko/KK_TMP_1/cad/0_print_best-screw_1h18m.gcode) <(tail -n$tail_len /media/kkocdko/KK_TMP_1/cad/0_print_test_screw_6m8s.gcode) | grep '|'
```

高速打印:

- https://wiki.creality.com/zh/ender-series/ender-3-v3-ke
- https://wiki.creality.com/zh/ender-series/ender-3-v3-ke/quick-start-guide/how-to-print-a-small-boat-quickly
- https://wiki.bambulab.com/zh/filament-acc/filament/slice-param
- https://wiki.creality.com/zh/software/creality-print/parameter-speed
- https://www.creality.cn/product-85.html


```sh
podman pull swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/debian:13
podman tag swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/debian:13 docker.io/debian:13
mkdir -p $HOME/misc/freecad_build_1
podman run --mount type=bind,src=$HOME/misc/freecad_build_1,dst=/root/freecad_build_1 -d --name freecad_build_1 --net host docker.io/library/debian:13 sleep infinity
podman exec -it freecad_build_1 bash
export LANG=C.UTF-8 LC_ALL=C.UTF-8 DEBIAN_FRONTEND=noninteractive
printf "Types: deb\nURIs: http://192.168.1.189:9630/debian\nSuites: trixie trixie-updates trixie-backports\nComponents: main contrib non-free non-free-firmware\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n\nTypes: deb\nURIs: http://192.168.1.189:9630/debian-security\nSuites: trixie-security\nComponents: main contrib non-free non-free-firmware\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n\n# > https://help.mirrorz.org/debian/\n# http://mirrors.bfsu.edu.cn/debian # and -security\n# http://mirrors.ustc.edu.cn/debian # and -security\n" > /etc/apt/sources.list.d/debian.sources
apt update
apt install -y -o Acquire::http::Pipeline-Depth=0 tmux git file curl python3 cmake ninja-build build-essential patchelf busybox-static zstd locales
apt install -y -o Acquire::http::Pipeline-Depth=0 --no-install-recommends libpyside6-dev pyside6-tools qt6-base-dev qt6-tools-dev qt6-wayland qt6-wayland-dev qt6-svg-dev libqt6uitools6 libshiboken6-dev libvtk9-dev graphviz imagemagick libboost-date-time-dev libboost-dev libboost-filesystem-dev libboost-graph-dev libboost-iostreams-dev libboost-program-options-dev libboost-regex-dev libboost-serialization-dev libboost-thread-dev libcoin-dev libkdtree++-dev libmedc-dev libocct-data-exchange-dev libocct-ocaf-dev libocct-visualization-dev libopencv-dev libproj-dev libpcl-dev libspnav-dev libx11-dev libxerces-c-dev libyaml-cpp-dev ninja-build occt-draw pyside2-tools python3-pyside6.qtgui python3-pyside6.qtwidgets python3-dev python3-defusedxml python3-git python3-markdown python3-matplotlib python3-packaging python3-pivy python3-ply python3-pybind11 swig xvfb
# libvtk9-dev Depends default-jdk
# libeigen3-dev libpyside2-dev libqt5opengl5-dev libqt5svg5-dev libqt5x11extras5-dev shiboken2 libshiboken2-dev libzipios++-dev ${vtk_dev} netgen netgen-headers
update-locale LANG=C.UTF-8 LC_ALL=C.UTF-8 # if you needs en_US.UTF-8, apt install locales-all
export ALL_PROXY=http://192.168.1.77:9091 ; export HTTP_PROXY=$ALL_PROXY HTTPS_PROXY=$ALL_PROXY

git clone --recurse-submodules --shallow-submodules --depth 2 --branch releases/FreeCAD-1-1 https://github.com/FreeCAD/FreeCAD
sed -i "s/compress-algo=zlib/compress-algo=none/g" cMake/FindPySide6Tools.cmake

export BUILD_TAG=dev-$(date +%Y%m%d-%H%M)
curl -fsSL https://pixi.sh/install.sh | sh
python3 package/scripts/write_version_info.py ../freecad_version.txt
cd package/rattler-build
pixi install
pixi run -e package create_bundle
# https://github.com/FreeCAD/FreeCAD/blob/releases/FreeCAD-1-1/.github/workflows/build_release.yml


mkdir -p $HOME/.config/ccache
echo "compression = false" > $HOME/.config/ccache/ccache.conf

begin_time=$(date +%s)
export BUILD_TAG=dev-$(date +%Y%m%d-%H%M)
rm -rf build
mkdir build
cmake -B build -G Ninja --preset release -DCMAKE_INSTALL_PREFIX=/usr
cmake --build build
DESTDIR=AppDir ninja -C build install
du -s -B M $HOME/.cache/ccache
echo $(( $(date +%s) - $begin_time ))
find $HOME/.cache/ccache -amin +$(( ( $(date +%s) - $begin_time + 60 - 1 ) / 60 )) -type f -delete # celi = (x + y - 1) / y
du -s -B M $HOME/.cache/ccache

tar --zstd -cf $HOME/freecad_build_1/ccache.tar.zst -C $HOME/.cache ccache

curl -o linuxdeploy.AppImage -L https://github.com/linuxdeploy/linuxdeploy/releases/download/1-alpha-20251107-1/linuxdeploy-x86_64.AppImage
chmod +x linuxdeploy.AppImage
./linuxdeploy.AppImage --appimage-extract
mv squashfs-root linuxdeploy

目标: 极限降低 FreeCAD 的 CI 用时
- https://github.com/FreeCAD/FreeCAD/actions/runs/19929229497/job/57136693440 (当前需要 1h41m)
- https://github.com/FreeCAD/FreeCAD/blob/main/.github/workflows/CI_master.yml
- https://doc.qt.io/qt-6/moc.html (关键在于 QT MOC 无法被 ccache 所缓存)
- https://github.com/ccache/ccache/discussions/1062
- https://github.com/ccache/ccache/pull/1156
- https://github.com/ccache/ccache/issues/956
- https://github.com/mozilla/sccache

https://github.com/mozilla/sccache/releases/download/v0.12.0/sccache-v0.12.0-x86_64-unknown-linux-musl.tar.gz
```

-->
