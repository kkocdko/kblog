```
title: Recording + Streaming on Linux Wayland
date: 2023.06.05 02:52
tags: Tutorial Linux
description: FFMpeg's kmsgrab
```

```
versions = gnome:44.1-1.fc38, libwayland:1.22.0-1.fc38, kernel:6.2.13-300.fc38, cpu:amd-r5-5600u-with-built-in-gpu
```

The distro I'm using is Fedora 38, with the default GNOME + Wayland pair. Although the Wayland was used widely many years ago, it's still weak in support in some edge fields like IME (for CJK users) and maybe screen casting / streaming / recording.

## [FFMpeg kmsgrab](https://ffmpeg.org/ffmpeg-devices.html#kmsgrab)

The main idea here, use FFMpeg's kmsgrab. First, ensure your environment has [VAAPI](https://trac.ffmpeg.org/wiki/Hardware/VAAPI) support. For AMD GPU running Fedora Linux, follow [this guide](https://fedoraproject.org/wiki/Firefox_Hardware_acceleration#Configure_VA-API_Video_decoding_on_AMD).

The awesome [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds) is statically built and many useful features are enabled. Choose `ffmpeg-master-latest-linux64-gpl.tar.xz`, extract the tarball and keep only ffmpeg binary.

Then, use this command:

```sh
~/misc/apps/ffmpeg \
  -f kmsgrab -device /dev/dri/card1 -framerate 60 -i - -vf 'hwmap=derive_device=vaapi,scale_vaapi=format=nv12' -c:v h264_vaapi -profile:v high -qp 20 \
  -y rec`date +%s`.mp4
```

<details>
<summary>Details (click to show)</summary>

```sh
watch -n 0.1 \
~/misc/apps/ffmpeg \
  -f kmsgrab -device /dev/dri/card1 -framerate 60 -i - -vf 'hwmap=derive_device=vaapi,scale_vaapi=format=nv12' -c:v h264_vaapi -profile:v high \
  -f rtsp -rtsp_transport tcp rtsp://127.0.0.1:8554/mystream

~/misc/apps/ffmpeg -re -stream_loop -1 -i ../dxchannel-callducks.mp4 -c copy -f rtsp -rtsp_transport tcp rtsp://127.0.0.1:8554/mystream
pactl list short sources

~/misc/apps/ffmpeg -i rec1683730234.mp4 -c:v libx264 -crf 20 -preset slower -y out.mp4
-b:v 2500k -maxrate 4000k
-f kmsgrab -device /dev/dri/card1 -framerate 20 -i - -vf 'hwmap=derive_device=vaapi,hwdownload,format=bgr0' -c:v vp8
-filter:v fps=30
~/misc/apps/ffmpeg -f pulse -ac 2 -i - -y ../o.mp3
-h encoder=h264_vaapi
-y rec`date +%s`.mp4
-qp 40
-vaapi_device /dev/dri/renderD128
-vf 'hwmap=derive_device=vaapi,scale_vaapi=format=nv12'
-vf 'hwmap=derive_device=vaapi,scale_vaapi=w=1920:h=1080:format=nv12'
-f flv rtmp://127.0.0.1:9658/live/home
crop=960:540:480:270 -vf 'hwdownload,format=bgr0'
-maxrate 9M
ffmpeg -format bgra -framerate 60 -f kmsgrab -thread_queue_size 1024 -i - \
  -f alsa -ac 2 -thread_queue_size 1024 -i hw:0 \
  -vf 'hwmap=derive_device=vaapi,scale_vaapi=w=1920:h=1080:format=nv12' \
  -c:v h264_vaapi -g 120 -b:v 3M -maxrate 3M -pix_fmt vaapi_vld -c:a aac -ab 96k -threads $(nproc) \
  output.mkv
```

</details>

- In my machine `-device /dev/dri/card1` is needed, other environments may use `card0` or `card2`.

- If you want `-c:v libx264`, change `format=nv12` to `format=bgr0`.

- Something like Chrome and QEMU-KVM will break recording after entering or exiting full-screen mode, try to delay recording command or avoid full-screen.

- For more help with `h264_vaapi`, try `-h encoder=h264_vaapi`.

## Other Choices

- [GNOME's built-in recorder](https://itsfoss.com/gnome-screen-recorder/). Certainly the simplest but: 1. Recording only, not streaming. 3. Force WebM (libvp8 soft-encoding), terrible for HDPI monitor and needed to be re-encoded before sending file to other people using various machines. So I drop it finally.

- [OBS Studio](https://obsproject.com). Maybe the most popular full-featured solution. It provides a [PipeWire capture source](https://www.linuxuprising.com/2021/06/obs-studio-27-released-with-wayland-and.html) for Wayland. But it's too heavy and complex.

## Thanks

Thanks for these article:

https://github.com/BtbN/FFmpeg-Builds

https://github.com/aler9/mediamtx/

https://github.com/aler9/mediamtx/issues/1329#issuecomment-1364853707

https://trac.ffmpeg.org/wiki/Capture/PulseAudio

https://wiki.tonytascioglu.com/scripts/ffmpeg/kmsgrab_screen_capture

https://stackoverflow.com/questions/58754385/record-linux-wayland-drm-screen-using-ffmpegs-kmsgrab-device-with-superimposed

http://www.ffmpeg.org/ffmpeg-codecs.html#VAAPI-encoders

https://trac.ffmpeg.org/wiki/Hardware/VAAPI

https://write.corbpie.com/ffmpeg-list-all-codecs-encoders-decoders-and-formats/

<!--

sion=20230405
  libavutil      58.  2.100 / 58.  2.100
  libavcodec     60.  3.100 / 60.  3.100
  libavformat    60.  3.100 / 60.  3.100
  libavdevice    60.  1.100 / 60.  1.100
  libavfilter     9.  3.100 /  9.  3.100
  libswscale      7.  1.100 /  7.  1.100
  libswresample   4. 10.100 /  4. 10.100
  libpostproc    57.  1.100 / 57.  1.100
Encoder h264_vaapi [H.264/AVC (VAAPI)]:
    General capabilities: dr1 delay hardware
    Threading capabilities: none
    Supported hardware devices: vaapi
    Supported pixel formats: vaapi
h264_vaapi AVOptions:
  -low_power         <boolean>    E..V....... Use low-power encoding mode (only available on some platforms; may not support all encoding features) (default false)
  -idr_interval      <int>        E..V....... Distance (in I-frames) between IDR frames (from 0 to INT_MAX) (default 0)
  -b_depth           <int>        E..V....... Maximum B-frame reference depth (from 1 to INT_MAX) (default 1)
  -async_depth       <int>        E..V....... Maximum processing parallelism. Increase this to improve single channel performance. This option doesn't work if driver doesn't implement vaSyncBuffer function. (from 1 to 64) (default 2)
  -max_frame_size    <int>        E..V....... Maximum frame size (in bytes) (from 0 to INT_MAX) (default 0)
  -rc_mode           <int>        E..V....... Set rate control mode (from 0 to 6) (default auto)
     auto            0            E..V....... Choose mode automatically based on other parameters
     CQP             1            E..V....... Constant-quality
     CBR             2            E..V....... Constant-bitrate
     VBR             3            E..V....... Variable-bitrate
     ICQ             4            E..V....... Intelligent constant-quality
     QVBR            5            E..V....... Quality-defined variable-bitrate
     AVBR            6            E..V....... Average variable-bitrate
  -qp                <int>        E..V....... Constant QP (for P-frames; scaled by qfactor/qoffset for I/B) (from 0 to 52) (default 0)
  -quality           <int>        E..V....... Set encode quality (trades off against speed, higher is faster) (from -1 to INT_MAX) (default -1)
  -coder             <int>        E..V....... Entropy coder type (from 0 to 1) (default cabac)
     cavlc           0            E..V.......
     cabac           1            E..V.......
     vlc             0            E..V.......
     ac              1            E..V.......
  -aud               <boolean>    E..V....... Include AUD (default false)
  -sei               <flags>      E..V....... Set SEI to include (default identifier+timing+recovery_point+a53_cc)
     identifier                   E..V....... Include encoder version identifier
     timing                       E..V....... Include timing parameters (buffering_period and pic_timing)
     recovery_point               E..V....... Include recovery points where appropriate
     a53_cc                       E..V....... Include A/53 caption data
  -profile           <int>        E..V....... Set profile (profile_idc and constraint_set*_flag) (from -99 to 65535) (default -99)
     constrained_baseline 578          E..V.......
     main            77           E..V.......
     high            100          E..V.......
  -level             <int>        E..V....... Set level (level_idc) (from -99 to 255) (default -99)
     1               10           E..V.......
     1.1             11           E..V.......
     1.2             12           E..V.......
     1.3             13           E..V.......
     2               20           E..V.......
     2.1             21           E..V.......
     2.2             22           E..V.......
     3               30           E..V.......
     3.1             31           E..V.......
     3.2             32           E..V.......
     4               40           E..V.......
     4.1             41           E..V.......
     4.2             42           E..V.......
     5               50           E..V.......
     5.1             51           E..V.......
     5.2             52           E..V.......
     6               60           E..V.......
     6.1             61           E..V.......
     6.2             62           E..V.......
-->
