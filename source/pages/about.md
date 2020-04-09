```
title: About
```

* 这是我的个人博客。

* 我想要一个清净、自由、无人干涉；没有喧嚣和**无逻辑**的争辩；<del>以<span id="wormhole-entrance">自我</span>为中心</del>，无需迁就读者的创作环境。

<style onload="if (!this.initialized) { this.initialized = true; const s = document.createElement('script'), w = document.querySelector('#wormhole-script'); s.textContent = w.textContent; w.parentNode.replaceChild(s, w) }"></style>

<!-- blocked -->
<script id="wormhole-script" type="blocked">(() => {
  'use strict'

  const wormhole = {}
  wormhole.accessToken = window.atob('YTQ1YWRjYTQzNTAzNDYzMTZlZmE4NzBmM2ZhMjk0Yzc1MDgzYTc4MA==')
  wormhole.container = document.querySelector('main>article')
  wormhole.entrance = document.querySelector('#wormhole-entrance')
  wormhole.content = document.createElement('div')
  wormhole.content.id = 'wormhole-content'
  wormhole.catalogue = wormhole.content.appendChild(document.createElement('ul'))
  wormhole.splitter = wormhole.content.appendChild(document.createElement('hr'))
  wormhole.post = wormhole.content.appendChild(document.createElement('aricle'))
  wormhole.timeout = 3000
  wormhole.timer = null
  wormhole.triggerTime = 0
  wormhole.onPointerDown = () => {
    console.log('wormhole_onpointerdown')
    wormhole.timer = setTimeout(() => {
      alert("由于页面架构更新，彩蛋暂时还不可用呢。。。");
      throw "";
      wormhole.triggerTime = Date.now()
      wormhole.entrance.classList.add('activated')
      wormhole.entrance.classList.add('in')
      wormhole.enter()
    }, wormhole.timeout)
  }
  wormhole.onPointerUp = () => {
    console.log('wormhole_onpointerup')
    clearTimeout(wormhole.timer)
  }
  wormhole.enter = async () => {
    const sleepAsync = async time => new Promise(resolve => setTimeout(resolve, time))
    const postsListUrl = `https://api.github.com/repos/kkocdko/_post_private/contents?access_token=${wormhole.accessToken}`
    const postsList = (await (await window.fetch(postsListUrl)).json()).reverse()
    // const postsList = Array(27).fill({ name: '2019-12-29-TestPost.md' })
    await new Promise(resolve => {
      const markedScript = document.head.appendChild(document.createElement('script'))
      markedScript.onload = resolve
      markedScript.src = '//cdn.jsdelivr.net/npm/marked@0.2.10/lib/marked.min.js'
    })
    postsList.forEach(post => {
      const postLink = wormhole.catalogue.appendChild(document.createElement('li'))
      postLink.textContent = post.name.replace(/\.md$/, '')
      postLink.addEventListener('click', async () => {
        wormhole.post.innerHTML = '<h3 style="text-align:center">Loading ...</h3>'
        wormhole.splitter.scrollIntoView({ behavior: 'smooth' })
        const postUrl = `${post.url.split('?')[0]}?access_token=${wormhole.accessToken}`
        const base64Str = (await (await window.fetch(postUrl)).json()).content
        const markdownStr = window.decodeURIComponent(window.escape(window.atob(base64Str)))
        wormhole.post.innerHTML = window.marked(markdownStr)
        await sleepAsync(10)
        wormhole.splitter.scrollIntoView({ behavior: 'smooth' })
      })
    })
    await sleepAsync(Math.max(0, 6000 - (Date.now() - wormhole.triggerTime)))
    wormhole.container.appendChild(wormhole.content)
    wormhole.entrance.classList.remove('in')
  }
  wormhole.entrance.addEventListener('pointerdown', wormhole.onPointerDown)
  wormhole.entrance.addEventListener('pointerup', wormhole.onPointerUp)
  wormhole.entrance.addEventListener('pointercancel', wormhole.onPointerUp)
  wormhole.entrance.addEventListener('contextmenu', e => e.preventDefault())
  wormhole.entrance.addEventListener('selectstart', e => e.preventDefault())
  wormhole.entrance.addEventListener('select', e => e.preventDefault())

})()</script>
<style>
  body {
    overflow: hidden auto;
  }

  #wormhole-entrance {
    position: relative;
  }

  #wormhole-entrance::before {
    position: absolute;
    top: calc(50% - 142vmax);
    left: calc(50% - 142vmax);
    width: 284vmax;
    height: 284vmax;
    background: #000;
    border-radius: 50%;
    transition: 3s;
    content: "";
  }

  #wormhole-entrance:not(.in)::before {
    transform: scale(0);
    visibility: hidden;
    opacity: 0;
    transition: 0s;
  }

  #wormhole-entrance::after {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    color: #eee;
    font-size: 5vmin;
    line-height: 100vh;
    text-align: center;
    background: #000;
    transition: 3s 3s;
    content: "高等的生灵啊，这话只说给你听";
  }

  #wormhole-entrance:not(.in)::after {
    visibility: hidden;
    opacity: 0;
    transition: 2s 2s;
  }

  #wormhole-entrance.activated {
    pointer-events: none;
  }

  #wormhole-entrance.activated::before,
  #wormhole-entrance.activated::after {
    z-index: 9;
  }

  #wormhole-content {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 7;
    padding: 2em;
    background: #fff;
    filter: invert(1);
  }
</style>
