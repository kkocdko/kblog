'use strict'

// In development mode, if the "async" is not supported, stop script
// Terser's "hoist_funs" option do the same thing
async () => {}

// ==============================

const defaultTitle = document.title
let articleInfoArr = []

const contentEl = document.querySelector('#content')
const loadingEl = document.querySelector('#loading-indicator')
const maskEl = document.querySelector('#mask')
const topBarEl = document.querySelector('header')
const sideBarEl = document.querySelector('aside')

const fadeInEl = el => el.classList.add('in')
const fadeOutEl = el => el.classList.remove('in')

loadingEl.fadeIn = () => fadeInEl(loadingEl)
loadingEl.fadeOut = () => fadeOutEl(loadingEl)
sideBarEl.fadeIn = () => [sideBarEl, maskEl].forEach(fadeInEl)
sideBarEl.fadeOut = () => [sideBarEl, maskEl].forEach(fadeOutEl)

// ==============================

// Fix the Blink's css bug
const unlockSideBar = () => setTimeout(() => { sideBarEl.style.display = maskEl.style.display = 'unset' }, 300)
window.addEventListener('DOMContentLoaded', unlockSideBar)
if (document.readyState === 'complete') unlockSideBar()

// ==============================

loadContentAsync()

// ==============================

document.querySelector('#js-open-side-bar').addEventListener('click', sideBarEl.fadeIn)

maskEl.addEventListener('mousedown', sideBarEl.fadeOut)

maskEl.addEventListener('touchstart', sideBarEl.fadeOut, { passive: true })

document.querySelector('aside>.nav').addEventListener('click', () => {
  window.scrollTo(0, 0)
  sideBarEl.fadeOut()
})

document.querySelector('#js-gotop').addEventListener('click', () => scrollToTop())

document.querySelector('#js-open-palette').addEventListener('click', () => {
  const color = window.prompt('Please input color (use css grammar)', 'rgb(0, 137, 123)')
  if (color) {
    document.body.style.setProperty('--theme-color', color)
    document.querySelector('meta[name=theme-color]').content = color
  }
})

window.addEventListener('scroll', (() => {
  let originScrollY = window.scrollY
  return () => {
    const currentScrollY = window.scrollY
    if (originScrollY < currentScrollY) {
      fadeOutEl(topBarEl)
    } else {
      fadeInEl(topBarEl)
    }
    originScrollY = currentScrollY
  }
})())

window.addEventListener('popstate', loadContentAsync)

// ==============================

async function loadContentAsync () {
  loadingEl.fadeIn()
  const pathName = window.location.pathname
  const firstPath = pathName.split('/')[1]
  switch (firstPath) {
    case 'article': {
      const articleId = pathName.split('article/')[1].split('/')[0]
      await loadMdPageAsync(`/src/article/${articleId}.md`)
      break
    }
    case 'home': {
      await loadArticleInfoArrAsync()
      const curPageNumber = Number(pathName.split('home/')[1].split('/')[0])
      const articleCountPerPage = 10
      let htmlStr = '<ul class="post-list">'
      for (
        let i = articleInfoArr.length - 1 - ((curPageNumber - 1) * articleCountPerPage), minI = i - articleCountPerPage;
        i > minI && i > -1;
        i--
      ) {
        const article = articleInfoArr[i]
        let tagListStr = ''
        for (const tag of article.tagArr) {
          tagListStr += `<li data-sl="/tag#${tag}">${tag}</li>`
        }
        // Source
        // htmlStr += `
        //   <li>
        //     <h3 data-sl="/article/${article.id}">${article.title}</h3>
        //     <p>${article.excerpt}</p>
        //     <ul class="post-footer">
        //       <li data-sl="/category#${article.category}">${article.category}</li>
        //       ${tagListStr}
        //     </ul>
        // </li>
        // `;

        // Compact
        htmlStr += `<li><h3 data-sl="/article/${article.id}">${article.title}</h3><p>${article.excerpt}</p><ul class="post-footer"><li data-sl="/category#${article.category}">${article.category}</li>${tagListStr}</ul></li>`
      }
      htmlStr += '</ul>'

      const pageNumberMax = Math.ceil(articleInfoArr.length / articleCountPerPage)
      // Source
      // htmlStr += `
      //   <ul class="page-number-nav">
      //     <li data-sl="/home/1">[◀</li>
      //     <li data-sl="/home/${curPageNumber > 1 ? curPageNumber - 1 : 1}">◀</li>
      //     <li data-sl="/home/${curPageNumber < pageNumberMax ? curPageNumber + 1 : pageNumberMax}">▶</li>
      //     <li data-sl="/home/${pageNumberMax}">▶]</li>
      //   </ul>
      // `;

      // Compact
      htmlStr += `<ul class="page-number-nav"><li data-sl="/home/1">[◀</li><li data-sl="/home/${curPageNumber > 1 ? curPageNumber - 1 : 1}">◀</li><li data-sl="/home/${curPageNumber < pageNumberMax ? curPageNumber + 1 : pageNumberMax}">▶</li><li data-sl="/home/${pageNumberMax}">▶]</li></ul>`

      htmlStr += `<title>Home: ${curPageNumber}</title>`
      contentEl.innerHTML = htmlStr
      afterContentLoads()
      break
    }
    case 'archive': {
      await loadArticleInfoArrAsync()
      let htmlStr =
        '<ul class="post-list compact">' +
        '<li>' +
        '<h2>Archive</h2>'
      for (let i = articleInfoArr.length - 1; i > -1; i--) {
        const article = articleInfoArr[i]
        // Source
        // htmlStr += `
        //   <h4 data-sl="/article/${article.id}">
        //     <span class="post-date">${article.date}</span>
        //      ${article.title}
        //   </h4>
        // `;

        // Compact
        htmlStr += `<h4 data-sl="/article/${article.id}"><span class="post-date">${article.date}</span>${article.title}</h4>`
      }
      htmlStr +=
        '</li>' +
        '</ul>' +
        '<title>Archive</title>'
      contentEl.innerHTML = htmlStr
      afterContentLoads()
      break
    }
    case 'category': {
      await loadArticleInfoArrAsync()
      let categoryArr = []
      for (const article of articleInfoArr) {
        categoryArr.push(article.category)
      }
      categoryArr = [...new Set(categoryArr)]

      const articleArrByCategory = {}
      for (const category of categoryArr) {
        articleArrByCategory[category] = []
      }

      for (const article of articleInfoArr) {
        articleArrByCategory[article.category].push({
          id: article.id,
          title: article.title
        })
      }

      let htmlStr = '<ul class="post-list compact">'
      for (let i = categoryArr.length - 1; i > -1; i--) {
        const category = categoryArr[i]
        htmlStr += `<li id="${category}">`
        htmlStr += `<h2>${category}</h2>`
        const articleArr = articleArrByCategory[category]
        for (let i = articleArr.length - 1; i > -1; i--) {
          const article = articleArr[i]
          htmlStr += `<h4 data-sl="/article/${article.id}">${article.title}</h4>`
        }
        htmlStr += '</li>'
      }
      htmlStr +=
        '</ul>' +
        '<title>Categories</title>'
      contentEl.innerHTML = htmlStr
      afterContentLoads()
      break
    }
    case 'tag': {
      await loadArticleInfoArrAsync()
      let tagArr = []
      for (const article of articleInfoArr) {
        tagArr.push(...article.tagArr)
      }
      tagArr = [...new Set(tagArr)]

      const articleArrByTag = {}
      for (const tag of tagArr) {
        articleArrByTag[tag] = []
      }

      for (const article of articleInfoArr) {
        for (const tag of article.tagArr) {
          articleArrByTag[tag].push({
            id: article.id,
            title: article.title
          })
        }
      }

      let htmlStr = '<ul class="post-list compact">'
      for (let i = tagArr.length - 1; i > -1; i--) {
        const tag = tagArr[i]
        htmlStr += `<li id="${tag}">`
        htmlStr += `<h2>${tag}</h2>`
        const articleArr = articleArrByTag[tag]
        for (let i = articleArr.length - 1; i > -1; i--) {
          const article = articleArr[i]
          htmlStr += `<h4 data-sl="/article/${article.id}">${article.title}</h4>`
        }
        htmlStr += '</li>'
      }
      htmlStr +=
        '</ul>' +
        '<title>Tags</title>'
      contentEl.innerHTML = htmlStr
      afterContentLoads()
      break
    }
    // case 'toy':
    // case 'callingcard':
    // case 'about':
    // case '404':
    default:
      await loadMdPageAsync(`/src/page/${firstPath}.md`)
      break
  }
  loadingEl.fadeOut()
}

async function loadArticleInfoArrAsync () {
  if (articleInfoArr.length === 0) {
    const response = await window.fetch('/src/json/articleinfo.json')
    articleInfoArr = await response.json()
  }
}

async function loadMdPageAsync (filePath) {
  let response = await window.fetch(filePath)
  if (response.status === 404) {
    response = await window.fetch('/src/page/404.md')
  }
  const markdownStr = await response.text()
  const htmlStr = `<div class="post-body"><article class="markdown-body">${window.marked(markdownStr)}</article></div>`
  contentEl.innerHTML = htmlStr
  window.scrollTo(0, 0)
  afterContentLoads()
}

function afterContentLoads () {
  setTimeout(() => {
    // Fix anchor
    const anchorEl = document.querySelector(window.location.hash || '--')
    if (anchorEl) {
      anchorEl.scrollIntoView()
    }

    // Refresh title
    const titleEl = document.querySelector('body title')
    document.title = titleEl
      ? titleEl.textContent + ' - ' + defaultTitle
      : defaultTitle

    // Set listeners
    document.querySelectorAll('[data-sl]').forEach(el => {
      el.removeEventListener('click', onSpaLinkClick)
      el.addEventListener('click', onSpaLinkClick)
    })
  })
}

function jumpToSpaLink (spaLink) {
  window.history.pushState(null, null, spaLink)
  loadContentAsync()
}

function onSpaLinkClick () {
  const spaLink = this.dataset.sl
  jumpToSpaLink(spaLink)
}

function scrollToTop (duration = 700) {
  const easeingFunction = t => --t * t * t + 1
  const originScrollY = window.scrollY
  // const originScrollX = scrollX
  const startTime = Date.now()
  let passedTime = 0
  const animationScroll = () => {
    if (passedTime < duration) {
      passedTime = Date.now() - startTime
      window.requestAnimationFrame(animationScroll)
      // window.scrollTo(originScrollX, originScrollY * (1 - easeingFunction(passedTime / duration)))
      window.scrollTo(0, originScrollY * (1 - easeingFunction(passedTime / duration)))
    }
  }
  animationScroll()
}
