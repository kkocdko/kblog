```
title: Differences in AMD P-State modes after kernel 6.3
date: 2023.09.18 08:17
tags: Note Linux Power
description: Trying to summarise it for your info
```

AMD P-State is a CPU scaling driver for AMD platforms, after the kernel 6.3, AMD P-State **EPP** has been added, making the current `amd_pstate=` kernel parameter one more available value. However, I've googled and haven't found a clearer summary, so I'll throw it out there. My personal summary of these modes is:

- `active`: i.e. EPP, OS can only give "suggestions", it's mainly up to the hardware and the driver to decide, and the fastest boost is for burst loads, only `performance` and `powersave` governors avaliable, and `energy_performance_preference` (obviously).

- `guided`: determined by the Driver within the constraints of the OS, but the role of the OS is weaker, and it is possible that the manually set upper limit may be exceeded sometimes.

- `passive`: controlled by OS, can adjust frequency precisely and manually, slower boosting.

> First released: https://t.me/archlinuxcn_group/2929521

### Reference

- https://docs.kernel.org/admin-guide/pm/amd-pstate.html

- https://www.phoronix.com/review/amd-pstate-epp-ryzen-mobile/6

- https://www.reddit.com/r/archlinux/comments/1381g2g/amd_pstate_epp_scaling_driver_available_with/

- https://www.phoronix.com/news/Linux-6.5-Power-Management
