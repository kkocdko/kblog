```
title: Using hwmoncat, a tiny alternative to lm_sensors
date: 2023.01.28 04:49
tags: Code Linux Devices Power
description: Yeah, w/o lm_sensors and it's annoy dependencies
```

[hwmoncat - kkocdko/utils4linux](https://github.com/kkocdko/utils4linux/tree/master/hwmoncat)

When it comes to sensors on Linux, the [lm-sensors](https://github.com/lm-sensors/lm-sensors) (`sensors` command) is the most common answer. However it's written in Perl and is compatible with old kernel, resulting in many dependencies:

```
[kkocdko@klf apps]$ sudo dnf install lm_sensors
... some boring logs
Installing dependencies:
 perl-AutoLoader  noarch  5.74-492.fc37
 perl-B           x86_64  1.83-492.fc37
 perl-Carp        noarch  1.52-489.fc37
... many many packages!
Install  59 Packages
Installed size: 26 M
```

However, after kernel `5.6`, we can read sensors easily through the [hwmon module](https://www.kernel.org/doc/html/latest/hwmon/), without any other dependencies. So I make this.

This script shows:

```
[kkocdko@klf apps]$ ./hwmoncat
- bat1
in0: 15.76 V
- nvme
temp1_composite: 30.85 C
- k10temp
temp1_tctl: 44.38 C
- iwlwifi_1
temp1: 34.00 C
- amdgpu
freq1_sclk: 1800 MHz
in0_vddgfx: 0.96 V
in1_vddnb: 0.69 V
power1_ppt: 18.00 W
temp1_edge: 35.00 C
```

Compare to the lm-sensors:

```
[kkocdko@klf apps]$ sensors
iwlwifi_1-virtual-0
Adapter: Virtual device
temp1:        +34.0°C

nvme-pci-0200
Adapter: PCI adapter
Composite:    +33.9°C  (low  =  -5.2°C, high = +79.8°C)
                       (crit = +84.8°C)

amdgpu-pci-0500
Adapter: PCI adapter
vddgfx:      662.00 mV
vddnb:       687.00 mV
edge:         +34.0°C
PPT:           2.00 W

k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +37.1°C

BAT1-acpi-0
Adapter: ACPI interface
in0:          15.75 V
```

## Thanks

- https://www.kernel.org/doc/html/latest/hwmon/

- https://unix.stackexchange.com/questions/558112/

- https://www.gnu.org/software/gawk/manual/gawk.html
