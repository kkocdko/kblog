```
title: Read Sensors Without Dependencies
date: 2023.01.28 04:49
tags: Code Linux
description: Yeah, w/o lm-sensors
```

> I18N: English | [简体中文](/./post/202301280450)

When it comes to sensors on Linux, the [lm-sensors](https://github.com/lm-sensors/lm-sensors) is the most common answer. We use it to read temperature, voltage and fan speed for many years.

It is written in Perl language and is compatible with old kernel version, resulting in many dependencies:

```
[kkocdko@klf apps]$ sudo dnf install lm_sensors
... some logs
Installing dependencies:
 perl-AutoLoader  noarch  5.74-492.fc37
 perl-B           x86_64  1.83-492.fc37
 perl-Carp        noarch  1.52-489.fc37
... many many packages!
Install  59 Packages
Installed size: 26 M
```

However, after kernel `5.6`, we can read sensors easily through the [hwmon module](https://www.kernel.org/doc/html/latest/hwmon/), without any other dependencies. So I write this helper script:

[hwmoncat - utils4fedora](https://github.com/kkocdko/utils4fedora/tree/master/hwmoncat)

This script shows:

```
[kkocdko@klf apps]$ ./hwmoncat
- bat1
in0: 15.671 V

- nvme
temp1_composite: 23.85 C

- amdgpu
freq1_sclk: 200 MHz
in0_vddgfx: 0.656 V
temp1_edge: 24.00 C

- k10temp
temp1_tctl: 24.88 C
```

Compare to the lm-sensors:

```
[kkocdko@klf apps]$ sensors
k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +31.0°C

nvme-pci-0200
Adapter: PCI adapter
Composite:    +25.9°C

amdgpu-pci-0500
Adapter: PCI adapter
vddgfx:      656.00 mV
edge:         +29.0°C

BAT1-acpi-0
Adapter: ACPI interface
in0:          15.67 V
```

## Thanks

- <https://www.kernel.org/doc/html/latest/hwmon/>

- <https://unix.stackexchange.com/questions/558112/>
