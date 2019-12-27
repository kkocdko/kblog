'use strict'

const defaultTitle = document.title
let articlesList

const mainBox = document.querySelector('main')
const loadingIndicator = document.querySelector('#loading')
const topBar = document.querySelector('header')
const sideBar = document.querySelector('#sidebar')
const sideBarMask = sideBar.querySelector('.mask')

async function loadContentAsync () {
  fadeInElement(loadingIndicator)
  const pathSectionsList = window.location.pathname.split('/')
  const firstPath = pathSectionsList[1]
  switch (firstPath) {
    case 'home': {
      await loadArticlesListAsync()

      const curPageNumber = Number(pathSectionsList[2])
      const countPerPage = 10
      let htmlStr = '<ul class="post-list">'
      for (
        let i = (curPageNumber - 1) * countPerPage, maxI = i + countPerPage, l = articlesList.length;
        i < maxI && i < l;
        i++
      ) {
        const article = articlesList[i]
        let tagsListStr = ''
        article.tagsList.forEach(tag => {
          tagsListStr += `<li data-sl="/tag#${tag}">${tag}</li>`
        })
        // Source
        // htmlStr += `
        //   <li>
        //     <h3 data-sl="/article/${article.id}">${article.title}</h3>
        //     <p>${article.excerpt}</p>
        //     <ul class="post-footer">
        //       <li data-sl="/category#${article.category}">${article.category}</li>
        //       ${tagsListStr}
        //     </ul>
        //   </li>
        // `
        // Compact
        htmlStr += `<li><h3 data-sl="/article/${article.id}">${article.title}</h3><p>${article.excerpt}</p><ul class="post-footer"><li data-sl="/category#${article.category}">${article.category}</li>${tagsListStr}</ul></li>`
      }
      htmlStr += '</ul>'

      const pageNumberMax = Math.ceil(articlesList.length / countPerPage)
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

      htmlStr += `<title>Home: ${curPageNumber}</title>`
      writeContent(htmlStr)
      break
    }
    case 'archive': {
      await loadArticlesListAsync()

      let htmlStr =
        '<ul class="post-list compact">' +
        '<li>' +
        '<h2>Archive</h2>'
      articlesList.forEach(article => {
        // Source
        // htmlStr += `
        //   <h3 data-sl="/article/${article.id}">
        //     <span class="post-date">${article.date}</span>
        //     ${article.title}
        //   </h3>
        // `
        // Compact
        htmlStr += `<h3 data-sl="/article/${article.id}"><span class="post-date">${article.date}</span>${article.title}</h3>`
      })
      htmlStr +=
        '</li>' +
        '</ul>' +
        '<title>Archive</title>'
      writeContent(htmlStr)
      break
    }
    case 'category': {
      await loadArticlesListAsync()

      const articlesListByCategory = new Map()
      articlesList.forEach(article => {
        if (!articlesListByCategory.has(article.category)) {
          articlesListByCategory.set(article.category, [])
        }
        articlesListByCategory.get(article.category).push(article)
      })

      let htmlStr = '<ul class="post-list compact">'
      articlesListByCategory.forEach((list, category) => {
        htmlStr +=
          `<li id="${category}">` +
          `<h2>${category}</h2>`
        list.forEach(article => {
          htmlStr += `<h3 data-sl="/article/${article.id}">${article.title}</h3>`
        })
        htmlStr += '</li>'
      })
      htmlStr +=
        '</ul>' +
        '<title>Categories</title>'
      writeContent(htmlStr)
      break
    }
    case 'tag': {
      await loadArticlesListAsync()

      const articlesListByTag = new Map()
      articlesList.forEach(article => {
        article.tagsList.forEach(tag => {
          if (!articlesListByTag.has(tag)) {
            articlesListByTag.set(tag, [])
          }
          articlesListByTag.get(tag).push(article)
        })
      })

      let htmlStr = '<ul class="post-list compact">'
      articlesListByTag.forEach((list, tag) => {
        htmlStr +=
          `<li id="${tag}">` +
          `<h2>${tag}</h2>`
        list.forEach(article => {
          htmlStr += `<h3 data-sl="/article/${article.id}">${article.title}</h3>`
        })
        htmlStr += '</li>'
      })
      htmlStr +=
        '</ul>' +
        '<title>Tags</title>'
      writeContent(htmlStr)
      break
    }
    case 'article':
      await loadMdPageAsync(`/src/article/${pathSectionsList[2]}.md`)
      break
    case '':
    case '404.html':
      jumpToSpaLink(new URLSearchParams(window.location.search).get('path') || '/home/1')
      break
    // case 'toy':
    // case 'callingcard':
    // case 'about':
    default:
      await loadMdPageAsync(`/src/page/${firstPath}.md`)
      break
  }
  fadeOutElement(loadingIndicator)
}

async function loadArticlesListAsync () {
  if (!articlesList) {
    articlesList = await (await window.fetch('/src/json/articleslist.json')).json()
  }
}

async function loadMdPageAsync (filePath) {
  const response = await window.fetch(filePath)
  const markdownStr = response.status === 404
    ? '<h3 style="text-align:center;font-size:7vmin">404 no found</h3><title>404 no found</title>'
    : await response.text()
  writeContent(`<article class="post-body markdown-body">${window.marked(markdownStr)}</article>`)
  window.scroll(0, 0)
}

function writeContent (htmlStr) {
  mainBox.innerHTML = htmlStr
  setTimeout(() => {
    // Fix anchor
    try { document.querySelector(window.location.hash).scrollIntoView() } catch (e) {}

    // Refresh title
    const titleTag = document.querySelector('body title')
    document.title = titleTag
      ? titleTag.textContent + ' - ' + defaultTitle
      : defaultTitle

    // Set listeners
    document.querySelectorAll('[data-sl]').forEach(el => el.addEventListener('click', onSpaLinkClick))
  })
}

function jumpToSpaLink (spaLink) {
  window.history.pushState(null, null, spaLink)
  loadContentAsync()
}

function onSpaLinkClick () {
  jumpToSpaLink(this.dataset.sl)
}

function fadeInElement (element) {
  element.classList.add('in')
}

function fadeOutElement (element) {
  element.classList.remove('in')
}

function fadeOutSideBar () {
  fadeOutElement(sideBar)
}

loadContentAsync()

window.addEventListener('popstate', loadContentAsync)

document.querySelector('#open-sidebar-btn').addEventListener('click', () => fadeInElement(sideBar))

sideBarMask.addEventListener('mousedown', fadeOutSideBar)

sideBarMask.addEventListener('touchstart', fadeOutSideBar, { passive: true })

sideBar.querySelector('ul').addEventListener('click', () => {
  window.scroll(0, 0)
  fadeOutSideBar()
})

document.querySelector('#gotop-btn').addEventListener('click', () =>
  // window.scroll({ top: 0, behavior: 'smooth' })
  document.documentElement.scrollIntoView({ behavior: 'smooth' })
)

document.querySelector('#open-palette-btn').addEventListener('click', () => {
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
setTimeout(() => sideBar.removeAttribute('style'), 700)
