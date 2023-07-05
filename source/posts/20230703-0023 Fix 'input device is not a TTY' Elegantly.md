```
title: Fix 'input device is not a TTY' Elegantly
date: 2023.07.03 00:23
tags: Note Linux Shell Docker
description: Satisfy its needs instead of remove -t switch
```

> I18N: English | [简体中文](/./post/202307030024)

## TLDR

`docker exec -it kblog df` -> `script -c 'docker exec -it kblog df' /dev/null`

## Explanation

Let's look at a common scenario. We try to create a container using an Ubuntu image and execute something inside.

```sh
# Run the container in the background
docker run -d --name kblog ubuntu tail -f /dev/null
# Execute the command inside the container (`-i -t` is shortened to `-it`)
docker exec -it kblog df
```

But if you write commands above to file `a.sh` and run `a.sh >a.txt`, you will see a Docker error in `a.txt`: `... input device is not a TTY ... `.

According to [docs](https://docs.docker.com/engine/reference/commandline/run/#name), the `-t` switch will alloc a pseudo-TTY. What does this mean? Let's start with the phenomenon: **without `-i`**, the `read` command inside the container can't read user input from stdin; **without `-t`**, you can't use the `Ctrl + C` to send SIGINT / SIGTERM to exit the program.

So we often use `-it` to make running a program inside a container work like running it natively (blocking, able to type in, able to use the Ctrl + some key). But since the `docker` command is not in a pty environment when using redirect / as a child process, the `-t` option then causes error.

The solution for most people is [removing `-t` switch](https://stackoverflow.com/a/48230089/11338291) or use some auto-detection to remove. But this may require huge command modifications, bringing a lot of inconsistencies.

I think a better way would be to:

Use the `script` command, which provides the ability to run commands innner pty. Just `script -c 'a.sh' a.txt`, then `docker exec -it kblog df` in `a.sh` will no longer report errors. If you don't need to save the output, just change the last argument to `/dev/null`.

## Extra

TTY in Linux is a long-established thing. The serial port or ttyUSB is the closest to the original usage. After we open Terminal, we use pseudo-TTY or PTY for short, and the mechanism is more complex, so read the documentation if you are interested.

Here is a special point: many people think that `puts("\n")` will [`sync`](https://man7.org/linux/man-pages/man2/sync.2.html) stdout's buffer, which is actually wrong. The **"refresh on newline encounter" is provided by PTY, stdout is just fd 1 and has no such special feature**. If you look at stdout in real time, using a hook or some other methods, you will be able to see this.

But you may find that in some languages, the print statement does immediately sync stdout on newline, such as Golang's `fmt.Println("hi")`. This is an operation that the language or language std lib does on its own. We should not rely on this language or library specific behavior if not necessary.

Reference:

https://askubuntu.com/questions/66195/what-is-a-tty-and-how-do-i-access-a-tty

https://unix.stackexchange.com/questions/13724/file-descriptors-shell-scripting

https://stackoverflow.com/questions/21778850/process-connected-to-separate-pty-for-stdout-and-stderr

https://stackoverflow.com/questions/4057985/disabling-stdout-buffering-of-a-forked-process/4058037#4058037
