```
title: Change Linux UKI cmdline without regeneration
date: 2024.10.21 04:41
tags: Code Linux Shell
description: Easily and fastly, just objcopy
```

> Certainly, modify EFI file cause signatures not valid. If you needs secure boot, try `efibootmgr` or other way.

First, When you generate the UKI, make the `.cmdline` section big enough to contains future modifies.

```sh
dracut --kernel-cmdline "$(printf %1024s)" --uefi ./linux.efi
# https://github.com/dracut-ng/dracut-ng/blob/105/modules.d/99base/init.sh#L332
```

Max cmdline length limit of kernel depends on the architecture and is between 256 and 4096 chars according to [the kernel docs](https://github.com/torvalds/linux/blob/v6.11/Documentation/admin-guide/kernel-parameters.rst). For example, x86=2048, arm=1024, arm64=2048, riscv=1024, so IMO use 1024 is enough.

Then, just use objcopy to replace the `.cmdline` section. The `\0` suffix must not be ignored.

```sh
printf 'root=/dev/disk/by-label/what mitigations=off \0' | objcopy --update-section .cmdline=/dev/stdin ./linux.efi
```
