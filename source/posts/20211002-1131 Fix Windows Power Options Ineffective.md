```
title: Fix Windows Power Options Ineffective
date: 2021.10.02 11:31
tags: Tutorial Power
description: Strange malfunction
```

If you don't know what "Power Options" is, try `Win` + `R` and execute this code:

```batch
rundll32 shell32.dll,Control_RunDLL PowerCfg.cpl @0,/editplan:SCHEME_BALANCED
```

So I encountered this bug, the config's **value changed, but not actually applied**.

My solution is overwrite current `scheme` by other normal scheme.

Suppose current scheme is "Balanced (SCHEME_BALANCED)", and overwrite it with "Power Saver (SCHEME_MAX)":

```batch
powercfg /s SCHEME_MAX
powercfg /export %temp%\scheme.pow SCHEME_MAX
powercfg /d SCHEME_BALANCED
powercfg /import %temp%\scheme.pow SCHEME_BALANCED
powercfg /changename SCHEME_BALANCED "BALANCED" ""
powercfg /s SCHEME_BALANCED
del %temp%\scheme.pow
```
