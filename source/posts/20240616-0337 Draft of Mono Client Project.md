```
title: Draft of Mono Client Project
date: 2024.06.16 03:37
tags: Note Linux
description: Only a draft for fun
```

## Structure

- Windows RDP -> Android Phone

- Linux SSH -> Android Phone

- Android Phone -> Hub -> Screen (Type-C DP)

- Android Phone -> Hub -> USB Disks

- Charger (PD) -> Hub -> Android Phone

## Points

- Android Phone must run LineageOS or other AOSP-like system.

- Android Phone touchable screen as desktop mode's mouse/touchpad.

- Android Phone heat: A lift-off 1cm² area on the back, which lifts up in desktop mode to allow the heatpipes to touch the SOC's shield.

- Desktop experience: Use Kiwi browser (Chromium) on Android, enable desktop mode.

- Software Development: Use VSCode remote web, extension host on Linux, UI on Kiwi browser, use SSH tunnel.

- Other GUI App: Use Windows RDP. Don't use Linux desktop.

- Connect other devices that needs high permission, like writing bootable USB disk or another Android Phone: Unsolved.

- Some Android Phone doesn't supports DP output: Unsolved.

### Why

It's a "multiplex-aholic" thinking that want to multiplex everything.

Like, I share Windows and Linux host with others, the only exclusive client is my Android Phone.

Multiplex even my Android Phone, uses it as both a normal phone and a compute unit of thin-client, and a mouse/touchpad.

It is also a kind of extreme case of the opposite of the "multi-client" advocated by many manufacturers nowadays. Certainly, manufacturers want to sell more clients, but in this draft, use mono-client instead.
