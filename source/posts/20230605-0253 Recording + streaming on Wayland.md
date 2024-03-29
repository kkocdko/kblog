```
title: Recording + streaming on Wayland
date: 2023.06.05 02:53
tags: Note Tutorial Linux
description: Use OBS, WebRTC or FFMpeg kmsgrab
```

```
With gnome:45.2, libwayland:1.22.0, kernel:6.6.4-200.fc39.x86_64, cpu:amd-r5-5600u-and-built-in-gpu
```

If you choose to do screen recording/streaming on Linux, it's certainly that you'll get more trouble than under Windows/macOS. Here are three ways:

## OBS Studio

[OBS Studio](https://obsproject.com). It provides a [PipeWire capture source](https://www.linuxuprising.com/2021/06/obs-studio-27-released-with-wayland-and.html) for Wayland.

Pros: it's the fact standard on recording/streaming with every platform.

Cons: you need to install many dependencies, and it's painful to custom deeply like VAAPI (GPU acceleration).

## Chromium WebRTC with mediamtx

Use [mediamtx](https://github.com/bluenviron/mediamtx) and through Chromium browser's WebRTC screen capture functions. You can find [my profile here](https://github.com/kkocdko/utils4linux/tree/master/livestream).

Pros: easy, high performance, low latency (thanks to WebRTC).

Cons: limited, if you want more custom.

## Video Capture Card

You can use an HDMI capture card, it needs extra money but not so much (39 chinese yuan currently, please choose the `ms2130` chipset). It can be used for SBC(Single Board Computer) also which has poor performance to run video capture inside.

## FFMpeg kmsgrab

Pros: maybe fastest if you deal with it properly.

Cons: mouse cursor is not able to be captured, and you need to run ffmpeg with root privileges.

The main idea here, use [FFMpeg kmsgrab](https://ffmpeg.org/ffmpeg-devices.html#kmsgrab). First, ensure your environment has [VAAPI](https://trac.ffmpeg.org/wiki/Hardware/VAAPI) support. For Fedora Linux with AMD GPU, follow [this guide](https://fedoraproject.org/wiki/Firefox_Hardware_acceleration#Configure_VA-API_Video_decoding_on_AMD).

The awesome [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds) is statically built and many useful features are enabled. Choose `ffmpeg-master-latest-linux64-gpl.tar.xz`, extract the tarball, and keep only ffmpeg binary.

Then, use these commands:

<details>
<summary>Details (click to show)</summary>

```sh
# set an alias
alias ffmpeg="/home/kkocdko/misc/apps/ffmpeg -hide_banner" # please always use latest master branch

# show encoder help
ffmpeg -h encoder=h264_vaapi

# list all avaliable mode in capture card or usb camera
ffmpeg -f video4linux2 -list_formats all -i /dev/video2

# repack file, from flv, to mp4
ffmpeg -i i.flv -c copy o.mp4

# recording, from capture card, through x264, to flv file
ffmpeg \
  -f video4linux2 -input_format yuyv422 -video_size 1920x1080 -framerate 10 -i /dev/video2 \
  -an -c:v libx264 -crf 22 -preset:v veryfast -threads 4 \
  -y rec_$(date +%s).flv

# streaming, from kmsgrab, through x264, to local udp, other environments may use card0 or card2
ffmpeg \
  -f kmsgrab -device /dev/dri/card1 -framerate 30 -i - -vf 'hwmap=derive_device=vaapi,hwdownload,format=bgr0' \
  -an -c:v libx264 -pix_fmt yuv420p -bf 0 -crf 22 -preset:v veryfast -threads 4 \
  -f mpegts 'udp://127.0.0.1:9254?pkt_size=1316'

# streaming, from kmsgrab, through h264_vaapi, to remote srt
ffmpeg \
  -f kmsgrab -device /dev/dri/card1 -framerate 30 -i - -vf 'hwmap=derive_device=vaapi,scale_vaapi=format=nv12' \
  -an -c:v h264_vaapi -profile:v high -qp 24 -compression_level 32 \
  -f mpegts 'srt://127.0.0.1:9254?streamid=publish:s0'

# encoding, through h264_vaapi
ffmpeg \
  -i i.mp4 \
  -vaapi_device /dev/dri/renderD128 -vf 'format=nv12,hwupload' \
  -c:v h264_vaapi -profile:v high -qp 24 -compression_level 32 \
  -c:a copy \
  o.h264_vaapi.mp4

# ===== other notes =====

# encoding, through svt-av1, crf 35 is enough for me, preset 0 is slowest, always tune=0
ffmpeg \
  -i i.mp4 \
  -c:v libsvtav1 -crf 35 -preset 0 -svtav1-params tune=0 \
  -c:a copy \
  o.svtav1.mp4

# concat use ffconcat file, remove metadata, use audio filter to ensure sync
ffmpeg \
  -f concat -i list.txt -map_metadata -1 \
  -c:v copy \
  -af aresample=async=1000 -c:a libopus -b:a 128k -compression_level 10 \
  o.concat.mp4

# combine video and audio
ffmpeg -i v.mp4 -i a.m4a -c:v copy -c:a copy -map 0:v:0 -map 1:a:0 o.combine.mp4

# maybe useful
-tune stillimage
# less latency but no recommended
-tune zerolatency
# move mp4 moov to front, recommended, no size punishment
-movflags faststart
# down to 30 fps
-vf fps=30
# using rtsp with tcp
-f rtsp -rtsp_transport tcp 'rtsp://127.0.0.1:9254/s0'
# output one frame
-ss 00:00:09.000 -frames:v 1 o.png
# good for old devices
-c:v libx264 -preset:v veryslow -crf 28 o.x264.mp4
# streaming use loop video
-re -stream_loop -1 -i i.mp4 -c copy
# never use vp8 please!
-c:v libvpx
# list pixel fmts
-pix_fmts
# use pixel fmts
-an -c:v h264 -pix_fmt yuv420p -profile:v high -level 4.1

# -progress pipe:1
# bd iso: dnf install mkvtoolnix mkvtoolnix-gui
# -bf 0
# -color_range 2
# pactl list short sources
# ~/misc/apps/ffmpeg -f pulse -ac 2 -i - -y ../o.mp3
# -qp 40
# -vaapi_device /dev/dri/renderD128
# -vf 'hwmap=derive_device=vaapi,scale_vaapi=format=nv12'
# -vf 'hwmap=derive_device=vaapi,scale_vaapi=w=1920:h=1080:format=nv12'
# -f flv rtmp://127.0.0.1:9658/live/home
# crop=960:540:480:270 -vf 'hwdownload,format=bgr0'
# -maxrate 9M
# -f alsa -ac 2 -thread_queue_size 1024 -i hw:0 \
# ffmpeg -i i.mp4 -y -c:v h264 -pix_fmt yuv420p -profile:v high -level 4.1 -vf scale=-1:720 o.mp4
```

</details>

- Something like Chrome and QEMU-KVM will interrupte kmsgrab after entering/exiting full-screen.

## Other Choices

- [GNOME's built-in recorder](https://itsfoss.com/gnome-screen-recorder/). Certainly the simplest but: 1. Recording only, not streaming. 3. Force WebM (libvp8 soft-encoding), terrible for HDPI monitor and needed to be re-encoded before sending file to other people using various machines. So I drop it finally.

## Reference

https://mkvtoolnix.download/downloads.html#fedora

https://stackoverflow.com/a/35520705

https://ffmpeg.org/ffmpeg-codecs.html#VAAPI-encoders

https://ffmpeg.org/ffmpeg-protocols.html

https://trac.ffmpeg.org/wiki/Capture/PulseAudio

https://trac.ffmpeg.org/wiki/Encode/H.264

https://trac.ffmpeg.org/wiki/Hardware/VAAPI

https://trac.ffmpeg.org/wiki/StreamingGuide

https://trac.ffmpeg.org/wiki/colorspace

https://github.com/BtbN/FFmpeg-Builds

https://github.com/YuzukiHD/YuzukiLOHCC-PRO

https://github.com/bluenviron/mediamtx/

https://github.com/bluenviron/mediamtx/issues/1329#issuecomment-1364853707

https://github.com/bluenviron/mediamtx/issues/1317

https://github.com/bluenviron/mediamtx/issues/2424

https://github.com/xqq/mpegts.js

https://srtlab.github.io/srt-cookbook/apps/ffmpeg.html

https://stackoverflow.com/q/58754385/

https://stackoverflow.com/q/62977448/

https://superuser.com/a/1777079

https://wiki.tonytascioglu.com/scripts/ffmpeg/kmsgrab_screen_capture

https://write.corbpie.com/ffmpeg-list-all-codecs-encoders-decoders-and-formats/

https://zhuanlan.zhihu.com/p/634052876

https://www.bilibili.com/read/cv17341923/

https://www.reddit.com/r/Fedora/comments/137e194/comment/jivq2ne/?utm_source=share&utm_medium=web2x&context=3
