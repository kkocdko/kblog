```
title: Tweak CPU Power Elegantly on Windows
date: 2021.10.04 19:50
tags: Tutorial Code CPP Power
description: WinAPI or powercfg cli tool
```

> KKOCDKO was watching movie on his laptop, but the fan system came into a start-stop cycle, which made him crazy: fan on > cooling > fan off > heating > fan on...

Go to "Control Panel > Power Options > Advanced Settings > Processor Power Management", set "Minimum processor state" to `0%`<sup>(1)</sup>, and the "Maximum processor state" is the point.

Set this value to `99%`, you can disable the boosting. To `0%`, make the frequency to lowest<sup>(2)</sup>. **But it is troublesome to change the value by hand every time**, so:

## Using `powercfg`

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

## Using WinAPI

Refer to the descriptions on [MSDN](https://docs.microsoft.com/en-us/windows/win32/api/powersetting/), we could find that there are some WinAPI provided functions which could modify the power config. So `boost-awhile.cc`:

```cpp
#include <windows.h>

#include <powrprof.h>

int main(int argc, char *argv[]) {
  DWORD percent = 100;
  if (argc == 2) {
    Sleep(1000);
    percent = 0;
  }
  GUID *scheme_guid = new GUID;
  PowerGetActiveScheme(NULL, &scheme_guid);
  PowerWriteACValueIndex(NULL, scheme_guid, &GUID_PROCESSOR_SETTINGS_SUBGROUP,
                         &GUID_PROCESSOR_THROTTLE_MAXIMUM, percent);
  PowerWriteDCValueIndex(NULL, scheme_guid, &GUID_PROCESSOR_SETTINGS_SUBGROUP,
                         &GUID_PROCESSOR_THROTTLE_MAXIMUM, percent);
  PowerSetActiveScheme(NULL, scheme_guid);
  // LocalFree(scheme_guid);
  return 0;
}
```

Execute `boost-awhile.exe` to set the frequency to maximum, with any argument like `boost-awhile.exe --calm` to set minimum after 1 second.

Seems much complex than `powercfg` cli tool? But **it's fast!** On my laptop, the `powercfg` took `200+ms` to finish its process, but this one took only `19ms`. This caused we could use this to modify our own CPU schedule policy. For example, I wrote a batch to compile my algorithm study project:

```batch
@echo off
start "" boost-awhile.exe
clang++ src\main.cc -o build\main -Wall -g -fsanitize=undefined -fsanitize=address -fno-omit-frame-pointer
start "" boost-awhile.exe --calm
build\main.exe
```

Now CPU runs on the maximum frequency **only in compile**. Without this, the default CPU schedule will jump to high frequency even if you move the cursor.

At this moment, I'm coding on our school library, battery usage in the previous 2 hours is only `14%` :-)
