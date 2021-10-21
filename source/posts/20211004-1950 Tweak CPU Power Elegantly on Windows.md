```
title: Tweak CPU Power Elegantly on Windows
date: 2021.10.04 19:50
tags: Tutorial Code Power
description: Using the powercfg
```

> KKOCDKO was watching movie on his laptop, but the fan system came into a start-stop cycle, which made him crazy: fan on > cooling > fan off > heating > fan on...

Go to "Control Panel > Power Options > Advanced Settings > Processor Power Management", set "Minimum processor state" to `0%`<sup>(1)</sup>, and the "Maximum processor state" is the point.

Set this value to `99%`, you can disable the boosting. To `0%`, make the frequency to lowest<sup>(2)</sup>. **But it is troublesome to change the value by hand every time**, so:

```batch
@echo off
echo   [1] High   [2] Medium   [3] Low
choice /c 123 >nul
if "%errorLevel%"=="1" set percent=100
if "%errorLevel%"=="2" set percent=99
if "%errorLevel%"=="3" set percent=0
powercfg /setacvalueindex SCHEME_BALANCED SUB_PROCESSOR PROCTHROTTLEMAX %percent%
powercfg /setdcvalueindex SCHEME_BALANCED SUB_PROCESSOR PROCTHROTTLEMAX %percent%
:: Make changes active
powercfg /s SCHEME_BALANCED
exit
```

> (1) [Parameter not showed?](https://thegeekpage.com/power-management-tab-missing/) or [Change Ineffective?](/./post/202110021131)
>
> (2) Not the lowest, on my `R5-5600U`, its `1099 MHz`.
>
> But why not Linux? Try [cpupower](https://wiki.archlinux.org/title/CPU_frequency_scaling#cpupower).
