```
title: Tradition and Modernity in Async Rust
date: 2022.08.16 20:27
tags: Code Rust Async
description: Poll，Future，async，The conversions and compatibility
```

> I18N: English | [简体中文](/./post/202208162028)

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

That's because: If `FileStream` was dropped, the `File` will be dropped together. Then if the executor is woken up unexpectedly after this, the program will try to read the `File` that has been dropped, resulting in read-after-free.

## References

> 1. <https://users.rust-lang.org/t/desugaring-async-fn/63698>
>
> 2. <https://aturon.github.io/blog/2016/08/11/futures/>
>
> 3. <https://docs.rs/tokio-stream/0.1.9/tokio_stream/wrappers/struct.BroadcastStream.html>
