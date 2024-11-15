```
title: Tradition and Modernity in Async Rust
date: 2022.08.16 20:27
tags: Code Rust Async
description: Poll，Future，async，The conversions and compatibility
```

🌐 - [简体中文](#translation-zh-cn)

> Prev knowledges: [async-book](https://rust-lang.github.io/async-book) and [tokio](https://tokio.rs) basics。

Back to 2019，after Rust 1.39 was released, the async ecos has shifted heavily to the `async / .await`. However, **limited by Rust's strict and complex type system**, many functions still require traditional methods today, which makes us sometimes need to shuttle between tradition and modernity. After my ~~archaeology~~ exploration, I got some tips & experience, and hope it can be helpful for you.

## Brief of Tradition and Modernity

As we all know, the primitive async is callback, `Future` encapsulates the callback, and `async` is a sugar for `Future`<sup>1</sup>.

Now let's implement a `File` to read file on disk asynchronously.

Traditional methods:

```rust
struct File;
impl File {
    fn poll_read(self: Pin<&mut Self>, cx: &mut Context) -> Poll<Vec<u8>> { todo!() }
}
fn run(file: Pin<&mut File>, cx: &mut Context) -> Poll<()> {
    let v = match file.poll_read(cx) {
        Poll::Ready(v) => v,
        Poll::Pending => return Poll::Pending,
    };
    println!("read finish");
    Poll::Ready(())
}
```

This reveals the essence of async fn in Rust: returning task status, binding the `Waker` in `Context` to notify the executor.

Modern methods:

```rust
struct File;
impl File {
    async fn read(&self) -> Vec<u8> { todo!() }
}
async fn run(file: File) {
    let v = file.read().await;
    println!("read finish");
}
```

Very concise. Compared with the traditions, the details are hidden without increasing the overhead.

But where is the `cx: &mut Context` ? We'll get to that in a moment.

## Tradition in Modernity

Sometimes a function in a third-party crate uses traditional writings, but we want to use it in `async {}`. It's a common requirement, we could use `poll_fn`:

```rust
// use futures::future::poll_fn;
use std::future::poll_fn; // stabilized in 1.64 (#99306)
let v = poll_fn(|cx| Pin::new(&mut file).poll_read(cx)).await;
```

View `poll_fn`'s define, it returns `PollFn`。This object can be `await` because it implements the `Future` trait and provided `fn poll()`. So if you want to use `fn poll_read()` in `async {}`, just wrap it, returns a object which implements `Future`：

```rust
// the detail of above
struct ReadFuture<'a>(&'a mut File);
impl<'a> Future for ReadFuture<'a> {
    type Output = Vec<u8>;
    fn poll(self: Pin<&mut Self>, cx: &mut Context) -> Poll<Self::Output> {
        // call `poll_read` in `poll`
        Pin::new(&mut *self.get_mut().0).poll_read(cx)
    }
}
let v = ReadFuture(&mut file).await; // called `poll`
```

As you may have guessed, `cx` is **implicitly** in `async {}`. When `.await` called, `cx` is passed to `ReadFuture::poll(self, cx)`, then passed to `File::poll_read(self, cx)`.

## Limitation of Modernity

Modern method is concise and powerful, but it's limited in many case. The most common are:

```rust
trait AsyncRead {
    async fn read(&self) -> Vec<u8>;
}
impl AsyncRead for File {
    async fn read(&self) -> Vec<u8> { todo!() }
}
```

Try to compile, we got [E0706](https://doc.rust-lang.org/error-index.html#E0706), and adviced to use [async-trait](https://docs.rs/async-trait) crate。

As to why it is difficult to declare `async fn` in `trait` currently， [this article](https://smallcultfollowing.com/babysteps/blog/2019/10/26/async-fn-in-traits-are-hard/) provided details. If you wouldn't want to know much more, read [explanation in async-trait docs](https://docs.rs/async-trait/0.1.57/async_trait/#explanation) at least, to understand the result of marco expand.

Generally, `async fn` is zero overhead, but `async-trait` isn't, it will cause unnecessary heap allocations. That's why many crate still use the trational methods, provide `fn poll_sth` which returns `Poll`. Such as [`tokio::net::TcpStream::poll_read`](https://docs.rs/tokio/1.20.1/tokio/net/struct.TcpStream.html#method.poll_read)。

## Modernity in Tradition

Now suppose you already know what async-trait is after expanding.

Then we may hit some trouble, such as trying to implement a trait that includes `poll_sth` for our struct. For example, the [`futures::stream::Stream`](https://docs.rs/futures/0.3.23/futures/stream/trait.Stream.html).

What we want is:

```rust
struct File;
impl File {
    async fn read(&self) -> Option<Vec<u8>> {
        tokio::time::sleep(Duration::from_millis(500)).await;
        Some(vec![1, 2, 3])
    }
}
struct FileStream;
impl Stream for FileStream {
    type Item = Vec<u8>;
    fn poll_next(self: Pin<&mut Self>, cx: &mut Context) -> Poll<Option<Self::Item>> {
        // call `File::read` here
    }
}
```

`File::read` simulates reading a file asynchronously, read some content each time, returns `None` if reached the end. Here to simplify the code, it never ended.

Let's create `FileStream` and implements the trait. `poll_next` should call async fn `File::read`. It will not be difficult, because `async` is just a syntax sugar, right? So we wrote about this:

```rust
struct FileStream {
    file: File,
    fut: Pin<Box<dyn Future<Output = Option<Vec<u8>>> + Send>>,
}
impl Stream for FileStream {
    type Item = Vec<u8>;
    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context) -> Poll<Option<Self::Item>> {
        let v = ready!(Pin::new(&mut self.fut).poll(cx));
        self.fut = Box::pin(self.file.read()); // error！
        // cannot borrow `self` as mutable because it is also borrowed as immutable
        Poll::Ready(v)
    }
}
```

After `Ready`, we must update `self.fut`. So we smoothly get the classic [E0502](https://doc.rust-lang.org/error-index.html#E0502).

The solution is simple, just **put `File` into `Future::Output`**. Each time we got a `self.fut` which is `Ready`, wrap `File` into next `Future`:

```rust
type FileStreamFuture = Pin<Box<dyn Future<Output = (Option<Vec<u8>>, File)> + Send>>;
struct FileStream(FileStreamFuture);
// in `poll_next`:
let (v, file) = ready!(self.0.as_mut().poll(cx));
self.0 = Box::pin(async { (file.read().await, file) });
```

As you can see, we now place the return value of `File::read` with `File` itself, to avoid holding both mutable and immutable borrows.

<details>
<summary>Complete runnable code (click to expand)</summary>

```rust
#![feature(future_poll_fn)] // stabilized in 1.64 (#99306)
use futures_core::{ready, Stream};
use std::future::{poll_fn, Future};
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::Duration;
struct File;
impl File {
    async fn read(&self) -> Option<Vec<u8>> {
        tokio::time::sleep(Duration::from_millis(500)).await;
        Some(vec![1, 2, 3])
    }
}
type FileStreamFuture = Pin<Box<dyn Future<Output = (Option<Vec<u8>>, File)> + Send>>;
struct FileStream(FileStreamFuture);
impl FileStream {
    fn make_future(file: File) -> FileStreamFuture {
        Box::pin(async { (file.read().await, file) })
    }
    fn new(file: File) -> Self {
        Self(Self::make_future(file))
    }
}
impl Stream for FileStream {
    type Item = Vec<u8>;
    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context) -> Poll<Option<Self::Item>> {
        let (v, file) = ready!(self.0.as_mut().poll(cx));
        self.0 = Self::make_future(file);
        Poll::Ready(v)
    }
}
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let mut file_stream = FileStream::new(File);
    while let Some(v) = poll_fn(|cx| Pin::new(&mut file_stream).poll_next(cx)).await {
        println!("{:?}", v);
    }
}
```

</details>

So complex. Or, change `File::read` to `poll_read` too? Ouch, Everything has regressed to 3 years ago, which is too uncomfortable, especially if the async fn to be called calls another async. It may not only be one function, but all functions called indirectly, even in third-party crates. This is a manifestation of the famous [Colored Function](https://morestina.net/blog/1686/rust-async-is-colored) problem.

The async fn returns opaque type. For convenience, we used trait object here. This can be avoided, but is beyond the topic of this article. You can take a look at [a common practice](https://github.com/kkocdko/ksite/blob/a2382aa/src/units/chat/mod.rs#L93-L112).

## Common Mistakes

Code in the previous section seems complex. If you are "smart" enough, you may think of the following "simplified method":

### Follow the "good ideas" of compiler

Write `file.read().poll(cx)` into `poll_next` directly, the compiler will hint you step by step. Use `Box` to store unsized object, haven't `fn poll()` but exists in `Pin<&mut>` ... In the end you will write this:

```rust
struct FileStream<'a>(Pin<&'a mut File>);
impl<'a> Stream for FileStream<'a> {
    type Item = Vec<u8>;
    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context) -> Poll<Option<Self::Item>> {
        ready!(Box::pin(self.0.as_mut().read()).as_mut().poll(cx))
    }
}
```

Try it out. Well, after outputting once, it's stuck. Why?

Certainly, `Context` contains `Waker` was put to the `File::read`'s `Future`, then `tokio::time::sleep`'s `Future`. After timer expired, executor should be waken up.

But we can see that in this way, the returned `Future` value of `File::read` was dropped at the end of `poll_next`, together with the timer's `Future` and `Waker`. Now that `Waker` is dropped, the executor can no longer be actively woken up. This spelling is wrong。**`Future` must be keep held before getting the output**。

### Use `unsafe` confidently

While we were trying to update `self.fut` but hit E0502 error, it doesn't seem to be any problem, the compiler is so stupid. There are two different fields in struct, which has no-overlapped memory area. So we directly resort to violence, using `unsafe`：

```rust
let file = unsafe { std::ptr::addr_of_mut!(self.file).as_mut().unwrap() };
self.fut = Box::pin(file.read());
```

（Confidently write comments on the side：`// safety: two fields was not overlapped`）

Compiled, it runs. But if you apply this on the program which deal with real files or network, and run it for a while, oh, `core dumped`!

That's because: If `FileStream` was dropped, the `File` will be dropped together. Then if the executor is woken up unexpectedly after this, the program will try to read the `File` that has been dropped, resulting in use-after-free.

## References

> 1. <https://users.rust-lang.org/t/desugaring-async-fn/63698>
>
> 2. <https://aturon.github.io/blog/2016/08/11/futures/>
>
> 3. <https://docs.rs/tokio-stream/0.1.9/tokio_stream/wrappers/struct.BroadcastStream.html>

## Translation

<details>
<summary id="translation-zh-cn">简体中文</summary>

> 前置知识：[async-book](https://rust-lang.github.io/async-book) 和 [tokio](https://tokio.rs) 基础。

时间回溯到 2019 年，在 Rust 1.39 发布后，异步生态大量地转向了使用 `async / .await` 的现代写法。但**受限于 Rust 严格而复杂的类型系统，许多功能时至今日依然需要传统写法**才能完成，这使得我们有时候需要在传统与现代写法之间穿梭。本人经过~~考古~~探索，得到了一些提示与经验，希望能对读者有帮助。

## 传统与现代写法简述

我们都知道，最原始的异步是回调的形式，`Future` 是对回调的封装，而 `async` 是 `Future` 的语法糖<sup>1</sup>。

现在假设我们要实现一个 `File`，用于异步读取硬盘上的文件。

传统写法：

```rust
struct File;
impl File {
    fn poll_read(self: Pin<&mut Self>, cx: &mut Context) -> Poll<Vec<u8>> { todo!() }
}
fn run(file: Pin<&mut File>, cx: &mut Context) -> Poll<()> {
    let v = match file.poll_read(cx) {
        Poll::Ready(v) => v,
        Poll::Pending => return Poll::Pending,
    };
    println!("read finish");
    Poll::Ready(())
}
```

传统写法揭示了 Rust 中异步函数的本质：返回任务状态，绑定 `Context` 中的 `Waker` 以及时通知调度器。

现代写法：

```rust
struct File;
impl File {
    async fn read(&self) -> Vec<u8> { todo!() }
}
async fn run(file: File) {
    let v = file.read().await;
    println!("read finish");
}
```

现代写法非常简洁。相比于传统写法，在不增加开销的前提下，隐藏了细节。

你可能会问，`cx: &mut Context` 去哪儿了？这个问题的答案，我们马上会提到。

## 现代中的传统

有时候我们会发现，库中的某个函数使用了传统写法，而我们需要在 `async {}` 中调用它。这种情况很常见。只需使用 `poll_fn`：

```rust
// use futures::future::poll_fn;
use std::future::poll_fn; // stabilized in 1.64 (#99306)
let v = poll_fn(|cx| Pin::new(&mut file).poll_read(cx)).await;
```

查看 `poll_fn` 的实现，我们发现它返回了一个 `PollFn`。这个对象之所以可以被 `await`，是因为它实现了 `Future` trait，提供了 `fn poll()`。若要在 `async {}` 中使用 `fn poll_read()`，就需要将它包裹一层，以返回一个实现了 `Future` 的对象：

```rust
struct ReadFuture<'a>(&'a mut File);
impl<'a> Future for ReadFuture<'a> {
    type Output = Vec<u8>;
    fn poll(self: Pin<&mut Self>, cx: &mut Context) -> Poll<Self::Output> {
        // 在 `poll` 中调用 `poll_read`
        Pin::new(&mut *self.get_mut().0).poll_read(cx)
    }
}
let v = ReadFuture(&mut file).await; // 调用了 `poll`
```

也许你已经猜到了，`cx` 在 `async {}` 中是**隐式存在**的。当 `.await` 时，`cx` 会被传递给 `ReadFuture::poll(self, cx)`，又传递给 `File::poll_read(self, cx)`。

## 现代写法的局限性

现代写法简洁有力，却在很多情况下无法使用。最常见的便是：

```rust
trait AsyncRead {
    async fn read(&self) -> Vec<u8>;
}
impl AsyncRead for File {
    async fn read(&self) -> Vec<u8> { todo!() }
}
```

尝试编译，会得到错误 [E0706](https://doc.rust-lang.org/error-index.html#E0706)，并建议使用 [async-trait](https://docs.rs/async-trait) 这个 crate。

至于为什么目前难以在 `trait` 中声明 `async fn`，[这篇文章](https://smallcultfollowing.com/babysteps/blog/2019/10/26/async-fn-in-traits-are-hard/) 中给出了详细解释。如果你不想学那么多鬼东西，也至少需要阅读 [async-trait 文档中的解释](https://docs.rs/async-trait/0.1.57/async_trait/#explanation)，了解一下宏展开后是什么样的。

一般来说，`async fn` 是零开销的，使用 `async-trait` 却并不是零开销的，它会导致不必要的堆分配。这也是为什么目前许多库中依然存在传统的，返回 `Poll` 的 `fn poll_sth` 写法，例如 [`tokio::net::TcpStream::poll_read`](https://docs.rs/tokio/1.20.1/tokio/net/struct.TcpStream.html#method.poll_read)。

## 传统中的现代

现在假设你已经知道了 async-trait 展开后的样子。

于是我们可能会碰到一些问题，比如想给自己的 struct 实现某个带有 `poll_sth` 函数的 trait。这里以 [`futures::stream::Stream`](https://docs.rs/futures/0.3.23/futures/stream/trait.Stream.html) 为例。

我们会需要实现：

```rust
struct File;
impl File {
    async fn read(&self) -> Option<Vec<u8>> {
        tokio::time::sleep(Duration::from_millis(500)).await;
        Some(vec![1, 2, 3])
    }
}
struct FileStream;
impl Stream for FileStream {
    type Item = Vec<u8>;
    fn poll_next(self: Pin<&mut Self>, cx: &mut Context) -> Poll<Option<Self::Item>> {
        // 在这里调用 File::read
    }
}
```

`File::read` 模拟异步读取文件，每次读取一点内容，文件结束时返回 `None`。这里为了简化代码，它是永远读不完的。

现在让我们创建 `FileStream` 并实现 trait。`poll_next` 需要不断地调用 async 函数 `File::read` 来读取内容。这应该不太难，对么？毕竟前边说过， async 只是语法糖。所以我们这么写：

```rust
struct FileStream {
    file: File,
    fut: Pin<Box<dyn Future<Output = Option<Vec<u8>>> + Send>>,
}
impl Stream for FileStream {
    type Item = Vec<u8>;
    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context) -> Poll<Option<Self::Item>> {
        let v = ready!(Pin::new(&mut self.fut).poll(cx));
        self.fut = Box::pin(self.file.read()); // error！
        // cannot borrow `self` as mutable because it is also borrowed as immutable
        Poll::Ready(v)
    }
}
```

获取到 `Ready` 后，我们肯定要更新 `self.fut`。于是我们顺理成章地得到了很经典的 [E0502](https://doc.rust-lang.org/error-index.html#E0502)。

解决的思路很简单，**把 `File` 也放进 `Future::Output`** 里边就可以了。我们每次得到 `Ready` 的 `self.fut` 之后，将其中的 `File` 包进下一个 `Future` 中。

```rust
type FileStreamFuture = Pin<Box<dyn Future<Output = (Option<Vec<u8>>, File)> + Send>>;
struct FileStream(FileStreamFuture);
// 在 poll_next 中：
let (v, file) = ready!(self.0.as_mut().poll(cx));
self.0 = Box::pin(async { (file.read().await, file) });
```

可以看到，我们现在将 `File::read` 的返回值与 `File` 本身放在了一起，这就避免了同时持有可变和不可变借用。

<details>
<summary>完整的可运行的代码（点击展开）</summary>

```rust
#![feature(future_poll_fn)] // stabilized in 1.64 (#99306)
use futures_core::{ready, Stream};
use std::future::{poll_fn, Future};
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::Duration;
struct File;
impl File {
    async fn read(&self) -> Option<Vec<u8>> {
        tokio::time::sleep(Duration::from_millis(500)).await;
        Some(vec![1, 2, 3])
    }
}
type FileStreamFuture = Pin<Box<dyn Future<Output = (Option<Vec<u8>>, File)> + Send>>;
struct FileStream(FileStreamFuture);
impl FileStream {
    fn make_future(file: File) -> FileStreamFuture {
        Box::pin(async { (file.read().await, file) })
    }
    fn new(file: File) -> Self {
        Self(Self::make_future(file))
    }
}
impl Stream for FileStream {
    type Item = Vec<u8>;
    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context) -> Poll<Option<Self::Item>> {
        let (v, file) = ready!(self.0.as_mut().poll(cx));
        self.0 = Self::make_future(file);
        Poll::Ready(v)
    }
}
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let mut file_stream = FileStream::new(File);
    while let Some(v) = poll_fn(|cx| Pin::new(&mut file_stream).poll_next(cx)).await {
        println!("{:?}", v);
    }
}
```

</details>

真麻烦。要不，把 `File::read` 也改成 `poll_read` 得了？哦，一切都退化到了三年前，这写起来太让人难受了，特别是如果要调用的 async fn 里又调用了别的 async fn，这时候需要修改的可能不仅仅是一个函数，而是所有被直接和间接调用的，甚至第三方 crate 里的函数，这几乎是不可能的。这就是著名的 [Colored Function](https://morestina.net/blog/1686/rust-async-is-colored) 问题的一个体现。

async fn 返回的是 opaque type，这里为了方便，使用了 tarit object。这是可以避免的，但已经超出了本文的主题。如果你感兴趣，可以看看 [一种常见的做法](https://github.com/kkocdko/ksite/blob/a2382aa/src/units/chat/mod.rs#L93-L112)。

## 常见的错误写法

上一节中的写法看起来似乎有点繁琐，如果你足够“聪明”，可能会想到如下的所谓“简化写法”：

### 听从编译器的馊主意

直接在 `poll_next` 中写下 `file.read().poll(cx)`，编译器会一步一步提示，需要套上 `Box` 以存储体积未知的对象，没有找到 `fn poll()` 但在 `Pin<&mut>` 中找到了…最后你会写出这个东西：

```rust
struct FileStream<'a>(Pin<&'a mut File>);
impl<'a> Stream for FileStream<'a> {
    type Item = Vec<u8>;
    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context) -> Poll<Option<Self::Item>> {
        ready!(Box::pin(self.0.as_mut().read()).as_mut().poll(cx))
    }
}
```

运行试试。欸，在输出了一次之后，它不动了。为什么？

显然，`Context` 中的 `Waker` 被传递给 `File::read` 返回的 `Future`，又被传递给 `tokio::time::sleep` 的 `Future`。当定时器到期后，它理应唤醒调度器。

但我们可以看到，在这种写法下，调用 `File::read` 后返回的 `Future`，在 `poll_next` 函数结束后，连带着里面的定时器 `Future` 和它所持有的 `Waker` 一同被 Drop 了。既然 `Waker` 被 Drop 了，调度器就不再能被主动唤醒。这种写法是错误的。**在获取到值之前，必须在一直持有 `Future`**。

### 自信地使用 `unsafe`

当我们尝试更新 `self.fut` 而碰上了 E0502 错误时，看起来，这似乎没什么问题，是编译器太傻了。这是 struct 里的两个字段，内存也不重叠。于是我们直接诉诸暴力，使用 `unsafe`：

```rust
let file = unsafe { std::ptr::addr_of_mut!(self.file).as_mut().unwrap() };
self.fut = Box::pin(file.read());
```

（顺便在旁边自信地写上注释：`// safety: two fields was not overlapped`）

通过编译了，运行，看起来不错。但如果将此程序改写，真的应用到了真实的文件或网络请求上后，运行一阵子，会发现，哦，`core dumped`！

这是因为：如果 `FileStream` 被 Drop 了，那么 `File` 也会被 Drop，在这之后如果调度器被意外唤醒，程序就会尝试读取已经被 Drop 掉的 `File`，导致 use-after-free。

## 参考文献

> 1. <https://users.rust-lang.org/t/desugaring-async-fn/63698>
>
> 2. <https://aturon.github.io/blog/2016/08/11/futures/>
>
> 3. <https://docs.rs/tokio-stream/0.1.9/tokio_stream/wrappers/struct.BroadcastStream.html>

</details>
