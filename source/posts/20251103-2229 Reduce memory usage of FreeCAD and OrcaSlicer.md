```
title: Reduce memory usage of FreeCAD and OrcaSlicer
date: 2025.11.03 22:29
tags: Linux CAD CAM
description: Some tricks
```

## FreeCAD

On my Debian 13 x86-64 this runs well. Main idea: Qt PySide compiles and embed QRC into huge `xxx_rc.py`, I dump data as bin file and use `open()`.

```sh
curl -o FreeCAD.AppImage -L https://github.com/FreeCAD/FreeCAD/releases/download/weekly-2025.10.31/FreeCAD_weekly-2025.10.31-Linux-x86_64-py311.AppImage
chmod +x FreeCAD.AppImage
./FreeCAD.AppImage --appimage-extract
pushd squashfs-root/usr ; rm -rf man fonts ssl ; popd
pushd squashfs-root/usr/share ; rm -rf doc icons man mysql opencv4 ; popd
pushd squashfs-root/usr/lib ; rm -rf qt6/bin qt6/plugins/qmlls qt6/qml/QtQuick $(ls | grep -E "^(lib)?(LLVM|clang|openvino|avcodec|rav1e|dav1d|avif|x265|x264|aom|SvtAv1Enc|opencv|mysqlclient|(open)?blas(p)?|pcl|protoc|protobuf|gtk)[\._-]") ; popd # vtk is used by mesh files like stl
pushd squashfs-root/usr/lib/python3.11/site-packages ; rm -rf OCC pandas scipy ifcopenshell matplotlib pip ; popd # vtkmodules
pushd squashfs-root
for entry in $(find -name "*_rc.py"); do
  suffix="$(tail -n 8 $entry | tr "\n" "|")"
  (tail -n +8 $entry | head -n -8 ; printf "with open(__file__+'.qrc_name.bin','wb')as f:\n    f.write(qt_resource_name)\nwith open(__file__+'.qrc_struct.bin','wb')as f:\n    f.write(qt_resource_struct)\nwith open(__file__+'.qrc_data.bin','wb')as f:\n    f.write(qt_resource_data)\nexit()") > $entry.tmp
  mv $entry.tmp $entry
  python3 $entry
  (printf "from PySide6 import QtCore\nwith open(__file__+'.qrc_name.bin','rb')as f:\n    qt_resource_name=f.read()\nwith open(__file__+'.qrc_struct.bin','rb')as f:\n    qt_resource_struct=f.read()\nwith open(__file__+'.qrc_data.bin','rb')as f:\n    qt_resource_data=f.read()\n" ; echo "$suffix" | tr "|" "\n") > $entry
done
popd
mv squashfs-root FreeCAD
# wayland: https://github.com/FreeCAD/FreeCAD/issues/6068
# see mkdebian, todo: a new post for 2 block xz
# tar -c FreeCAD | xz -T2 -9e --block-size $(( $(tar -c FreeCAD | wc -c) / 2 + 64 )) > FreeCAD.tar.xz
```

Before (left) and after (right):

![Screenshot to compare memory usage](https://github.com/user-attachments/assets/e3ad2e77-9a59-4e48-b0c9-5f479e751ad6)

## OrcaSlicer

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

-->
