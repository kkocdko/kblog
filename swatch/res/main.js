'use strict'

let postsList
const defaultTitle = document.querySelector('title').dataset.default

const mainBox = document.querySelector('main')
const loadingIndicator = document.querySelector('#loading')
const topBar = document.querySelector('header')
const sideBar = document.querySelector('#sidebar')
const sideBarMask = sideBar.querySelector('.mask')

const loadContentAsync = async () => {
  fadeInElement(loadingIndicator)
  const pathSectionsList = window.location.pathname.split('/')
  const firstPath = pathSectionsList[1]
  switch (firstPath) {
    case 'home': {
      await loadPostsListAsync()

      const curPageNumber = Number(pathSectionsList[2])
      const countPerPage = 10
      let htmlStr =
        `<h1 style="display:none">Home: ${curPageNumber}</h1>` +
        '<ul class="post-list">'
      for (
        let i = (curPageNumber - 1) * countPerPage, maxI = i + countPerPage, l = postsList.length;
        i < maxI && i < l;
        i++
      ) {
        const post = postsList[i]
        let tagsListStr = ''
        post.tags.forEach(tag => {
          tagsListStr += `<li data-sl="/tag#${tag}">${tag}</li>`
        })
        // Source
        // htmlStr += `
        //   <li>
        //     <h3 data-sl="/post/${post.id}">${post.title}</h3>
        //     <p>${post.description}</p>
        //     <ul class="post-footer">
        //       <li data-sl="/category#${post.category}">${post.category}</li>
        //       ${tagsListStr}
        //     </ul>
        //   </li>
        // `
        // Compact
        htmlStr += `<li><h3 data-sl="/post/${post.id}">${post.title}</h3><p>${post.description}</p><ul class="post-footer"><li data-sl="/category#${post.category}">${post.category}</li>${tagsListStr}</ul></li>`
      }
      htmlStr += '</ul>'

      const pageNumberMax = Math.ceil(postsList.length / countPerPage)
      // Source
      // htmlStr += `
      //   <ul class="page-number-nav">
      //     <li data-sl="/home/1">〈◀</li>
      //     <li data-sl="/home/${curPageNumber > 1 ? curPageNumber - 1 : 1}">◀</li>
      //     <li data-sl="/home/${curPageNumber < pageNumberMax ? curPageNumber + 1 : pageNumberMax}">▶</li>
      //     <li data-sl="/home/${pageNumberMax}">▶〉</li>
      //   </ul>
      // `
      // Compact
      htmlStr += `<ul class="page-number-nav"><li data-sl="/home/1">〈◀</li><li data-sl="/home/${curPageNumber > 1 ? curPageNumber - 1 : 1}">◀</li><li data-sl="/home/${curPageNumber < pageNumberMax ? curPageNumber + 1 : pageNumberMax}">▶</li><li data-sl="/home/${pageNumberMax}">▶〉</li></ul>`
      writeContent(htmlStr)
      break
    }
    case 'archive': {
      await loadPostsListAsync()

      let htmlStr =
        '<h1 style="display:none">Archive</h1>' +
        '<ul class="post-list compact">' +
        '<li>' +
        '<h2>Archive</h2>'
      postsList.forEach(post => {
        // Source
        // htmlStr += `
        //   <h3 data-sl="/post/${post.id}">
        //     <span class="post-date">${post.date}</span>
        //     ${post.title}
        //   </h3>
        // `
        // Compact
        htmlStr += `<h3 data-sl="/post/${post.id}"><span class="post-date">${post.date}</span>${post.title}</h3>`
      })
      htmlStr +=
        '</li>' +
        '</ul>'
      writeContent(htmlStr)
      break
    }
    case 'category': {
      await loadPostsListAsync()

      const postsListByCategory = new Map()
      postsList.forEach(post => {
        if (!postsListByCategory.has(post.category)) {
          postsListByCategory.set(post.category, [])
        }
        postsListByCategory.get(post.category).push(post)
      })

      let htmlStr =
        '<h1 style="display:none">Categories</h1>' +
        '<ul class="post-list compact">'
      postsListByCategory.forEach((list, category) => {
        htmlStr +=
          `<li id="${category}">` +
          `<h2>${category}</h2>`
        list.forEach(post => {
          htmlStr += `<h3 data-sl="/post/${post.id}">${post.title}</h3>`
        })
        htmlStr += '</li>'
      })
      htmlStr += '</ul>'
      writeContent(htmlStr)
      break
    }
    case 'tag': {
      await loadPostsListAsync()

      const postsListByTag = new Map()
      postsList.forEach(post => {
        post.tags.forEach(tag => {
          if (!postsListByTag.has(tag)) {
            postsListByTag.set(tag, [])
          }
          postsListByTag.get(tag).push(post)
        })
      })

      let htmlStr =
        '<h1 style="display:none">Tags</h1>' +
        '<ul class="post-list compact">'
      postsListByTag.forEach((list, tag) => {
        htmlStr +=
          `<li id="${tag}">` +
          `<h2>${tag}</h2>`
        list.forEach(post => {
          htmlStr += `<h3 data-sl="/post/${post.id}">${post.title}</h3>`
        })
        htmlStr += '</li>'
      })
      htmlStr += '</ul>'
      writeContent(htmlStr)
      break
    }
    case 'post':
      await loadMdPageAsync(`/res/posts/${pathSectionsList[2]}.md.html`)
      break
    // case 'toy':
    // case 'callingcard':
    // case 'about':
    default:
      await loadMdPageAsync(`/res/pages/${firstPath}.md.html`)
      break
  }
  fadeOutElement(loadingIndicator)
}

const loadPostsListAsync = async () => {
  if (!postsList) {
    postsList = await (await window.fetch('/res/postslist.json')).json()
  }
}

const loadMdPageAsync = async url => {
  const response = await window.fetch(url)
  const markdownStr = response.status === 404
    ? '<h1 style="text-align:center;border:none">404 not found</h1>'
    : await response.text()
  writeContent(`<article class="markdown-body">${markdownStr}</article>`)
  window.scroll(0, 0)
}

const writeContent = htmlStr => {
  mainBox.innerHTML = htmlStr
  setTimeout(() => {
    // Fix hash anchor
    const hash = window.location.hash.substr(1)
    if (hash) {
      const anchor = document.getElementById(hash)
      if (anchor) anchor.scrollIntoView()
    }

    // Set title
    const titleTag = mainBox.querySelector('h1')
    document.title = titleTag
      ? titleTag.textContent + ' - ' + defaultTitle
      : defaultTitle

    // Set listeners
    listenSpaLinks()
  })
}

const listenSpaLinks = () => {
  document.querySelectorAll('[data-sl]').forEach(el =>
    el.addEventListener('click', onSpaLinkClick)
  )
}

const onSpaLinkClick = function () {
  window.history.pushState(null, null, this.dataset.sl)
  loadContentAsync()
}

const fadeInElement = element => element.classList.add('in')

const fadeOutElement = element => element.classList.remove('in')

const fadeOutSideBar = () => fadeOutElement(sideBar)

if (mainBox.innerHTML) {
  listenSpaLinks()
} else {
  loadContentAsync()
}

window.addEventListener('popstate', loadContentAsync)

document.querySelector('#show-sidebar-btn').addEventListener('click', () =>
  fadeInElement(sideBar)
)

sideBarMask.addEventListener('pointerdown', fadeOutSideBar)

sideBar.querySelector('ul').addEventListener('click', () => {
  window.scroll(0, 0)
  fadeOutSideBar()
})

document.querySelector('#gotop-btn').addEventListener('click', () =>
  // window.scroll({ top: 0, behavior: 'smooth' })
  document.documentElement.scrollIntoView({ behavior: 'smooth' })
)

document.querySelector('#show-palette-btn').addEventListener('click', () => {
  const color = window.prompt('Input color (in css format)', 'rgb(0, 137, 123)')
  if (color) {
    document.body.style.setProperty('--theme-color', color)
    document.querySelector('meta[name=theme-color]').content = color
  }
})

{
  let originScrollY = 0
  let currentScrollY
  window.addEventListener('scroll', () => {
    currentScrollY = window.scrollY
    if (currentScrollY > originScrollY) {
      fadeOutElement(topBar)
    } else {
      fadeInElement(topBar)
    }
    originScrollY = currentScrollY
  })
}

// Fix the Blink's css bug
setTimeout(() => { sideBar.style = '' }, 700)
