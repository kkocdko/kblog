```
title: 用 GDB + Python 获取 Linux 端微信本地数据库密钥
date: 2025.10.21 21:34
tags: Linux GDB Python
description: 但是图片密钥还没做
```

https://github.com/ycccccccy/wx_key/issues/37

`wechat_gdb.py`:

```python
import gdb
import re
import sys
sys.stdout = sys.stderr
relative = "0x658FC90" # linux_4.1.0.10 = 0x658FC90
base = next(line.split()[0] for line in gdb.execute("info proc mapping", to_string=True).splitlines() if line.strip().endswith("/wechat"))
bp = gdb.Breakpoint(f"* {base} + {relative}")
print(f"base = {base}, relative = {relative}, breakpoint has been set, please login wechat")
gdb.execute("continue") # wait to breakpoint
print(f"breakpoint hit_count = {bp.hit_count}, now, reading memory")
assert gdb.execute("x/1gx $rsi+16", to_string=True).strip().endswith('0x0000000000000020'), "expect size == 0x20 == 32 bytes"
key = re.compile(r"^.*?:\s*|0x|\s+", re.MULTILINE).sub("", gdb.execute("x/32bx *(void**)($rsi+8)", to_string=True))
print(f"key = {key}")
# windows may use https://github.com/ssbssa/gdb/releases/download/gdb-16.3.90.20250511/gdb-16.3.90.20250511-x86_64-python.7z
# sudo gdb --pid=$(pgrep wechat) --batch-silent --command=wechat_gdb.py
```

启动微信（若已登录需退出登录），执行末尾注释中的命令，登录微信，得到 key。

执行结果如下：

```sh
kkocdko@klp1:/media/kkocdko/KK_TMP_1$ sudo gdb --pid=$(pgrep wechat) --batch-silent --command=wechat_gdb.py
base = 0x000056149d732000, relative = 0x658FC90, breakpoint has been set, please login wechat
breakpoint hit_count = 1, now, reading memory
key = 22aa33bb44cc55dd22aa33bb44cc55dd22aa33bb44cc55dd22aa33bb44cc55dd
kkocdko@klp1:/media/kkocdko/KK_TMP_1$
```

再次感谢作者提供的思路。另外，微信的 DLL 或 ELF 体积很大，为加速 IDA 分析，可以考虑打开时选择 Kernel options，在 Option 1 只开 "Trace executing flow" 和 "Create functions if code is present"，在 Option 3 关 EH 和 RTTI。

---

不得不说，大模型写这个真是一团糟，写出一大串一两百行根本没法用的垃圾。还是得古法编程靠谱。

<!--
- 扫 AES 图片 Key : https://github.com/recarto404/WxDatDecrypt/blob/main/key.py
- https://ppwwyyxx.com/blog/2025/wechat-dump-10-years/#WXGF-%E8%A7%A3%E7%A0%81
- https://sarv.blog/posts/wxam/
- https://github.com/sjzar/chatlog/issues/197
- https://github.com/ppwwyyxx/wechat-dump
- https://github.com/Symb0x76/chatlog?tab=readme-ov-file
- https://github.com/recarto404/WxDatDecrypt/tree/main
- https://github.com/Tencent/wcdb/blob/b9472e220ca5204ee6b530251a5225d2fff70e7c/src/common/base/UnsafeData.hpp#L61
- https://github.com/ycccccccy/wx_key/blob/437b7a7b71406d0785b3076d6ef4c8bfe56165f8/wx4.1_analysis.md
-->
