```
title: 更优雅地解决 Docker 'input device is not a TTY'
date: 2023.07.03 00:24
tags: Note Linux Shell Docker
description: 满足它，而不是移除 -t 选项
```

> I18N: [English](/./post/202307030023) | 简体中文

## TLDR

`docker exec -it kblog df` -> `script -c 'docker exec -it kblog df' /dev/null`

## 原理解析

来看一个比较常见的场景，我们尝试使用 Ubuntu 镜像创建容器，在容器内做点事情。

```sh
# 后台运行容器
docker run -d --name kblog ubuntu tail -f /dev/null
# 在容器内执行命令（`-i -t` 简写为 `-it`）
docker exec -it kblog df
```

但如果将以上命令写入 `a.sh` 并运行 `a.sh >a.txt`，会发现 `a.txt` 中出现了 Docker 的报错 `... input device is not a TTY ...`。

据 [文档](https://docs.docker.com/engine/reference/commandline/run/#name)，`-t` 选项尝试分配一个 pseudo-TTY。这是什么意思呢？先说现象：如果 **不使用 `-i`**，那么容器内运行 `read` 命令就无法从 stdin 读取用户输入；如果 **不使用 `-t`**，那么容器内运行一个程序的中途，就无法使用 `Ctrl + C` 组合键发送 SIGINT / SIGTERM 使程序退出。

于是我们就经常会使用 `-it`，使容器内运行程序效果类似于本机运行（阻塞，能输入，能使用 Ctrl 组合键）。但由于使用重定向/作为其他程序的子进程时，`docker` 命令并未处在 pty 环境中，于是 `-t` 选项就会导致报错。

大多数人的解决方案是 [移除 `-t` 选项](https://stackoverflow.com/a/48230089/11338291)，或者使用一些自动检测的方式移除 `-t` 选项。但这可能需要修改大量命令，带来写法的不一致。

我认为更好的方案是：

使用 `script` 命令，它提供了在 pty 环境中运行命令的功能。我们只需要运行 `script -c 'a.sh' a.txt`，那么 `a.sh` 中的 `docker exec -it kblog df` 就不再报错了。如果不需要保存输出，最后一个参数改为 `/dev/null` 即可。

## 多余的话

Linux 中的 TTY 是个历史悠久的玩意儿。通过串口或 ttyUSB 是最接近原始的用法。在我们打开 Terminal 后，我们使用的是 pseudo-TTY 简称 PTY，其机制较为复杂，感兴趣的可以自行阅读文档。

这里有一个特别的知识点：很多人认为 `puts("\n")` 会 [`sync`](https://man7.org/linux/man-pages/man2/sync.2.html) stdout 的缓冲区，其实这是错误的。**“在遇到换行符时刷新”是由 PTY 提供的，stdout 只是 fd 1 而已，并没有这样的特异功能**。如果你使用 hook 或者别的手段，实时观察 stdout，就能明确这一点。

但你可能会发现，在某些语言中，print 语句确实会立刻或在换行时 sync stdout，例如 Golang 的 `fmt.Println("hi")`。这是语言或语言标准库自行作出的操作。如非必要，我们不应当依赖这种语言或库的特定行为。

参考文章如下：

- https://askubuntu.com/q/66195

- https://unix.stackexchange.com/q/13724

- https://stackoverflow.com/q/21778850

- https://stackoverflow.com/a/4058037
