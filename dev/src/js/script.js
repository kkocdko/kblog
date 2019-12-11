'use strict'

const defaultTitle = document.title
let articlesList = []

const contentBox = document.querySelector('#content')
const loadingIndicator = document.querySelector('#loading')
const maskLayer = document.querySelector('#mask')
const topBar = document.querySelector('header')
const sideBar = document.querySelector('aside')

async function loadContentAsync () {
  fadeInElement(loadingIndicator)
  const pathName = window.location.pathname
  const firstPath = pathName.split('/')[1]
  switch (firstPath) {
    case 'article': {
      const articleId = pathName.split(firstPath)[1].split('/')[1]
      await loadMdPageAsync(`/src/article/${articleId}.md`)
      break
    }
    case 'home': {
      await loadArticlesListAsync()

      const curPageNumber = Number(pathName.split(firstPath)[1].split('/')[1])
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
        // </li>
        // `;
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
      // `;
      // Compact
      htmlStr += `<ul class="page-number-nav"><li data-sl="/home/1">〈◀</li><li data-sl="/home/${curPageNumber > 1 ? curPageNumber - 1 : 1}">◀</li><li data-sl="/home/${curPageNumber < pageNumberMax ? curPageNumber + 1 : pageNumberMax}">▶</li><li data-sl="/home/${pageNumberMax}">▶〉</li></ul>`

      htmlStr += `<title>Home: ${curPageNumber}</title>`
      contentBox.innerHTML = htmlStr
      afterContentLoads()
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
        //   <h4 data-sl="/article/${article.id}">
        //     <span class="post-date">${article.date}</span>
        //      ${article.title}
        //   </h4>
        // `;
        // Compact
        htmlStr += `<h4 data-sl="/article/${article.id}"><span class="post-date">${article.date}</span>${article.title}</h4>`
      })
      htmlStr +=
        '</li>' +
        '</ul>' +
        '<title>Archive</title>'
      contentBox.innerHTML = htmlStr
      afterContentLoads()
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
          htmlStr += `<h4 data-sl="/article/${article.id}">${article.title}</h4>`
        })
        htmlStr += '</li>'
      })
      htmlStr +=
        '</ul>' +
        '<title>Categories</title>'
      contentBox.innerHTML = htmlStr
      afterContentLoads()
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
          htmlStr += `<h4 data-sl="/article/${article.id}">${article.title}</h4>`
        })
        htmlStr += '</li>'
      })
      htmlStr +=
        '</ul>' +
        '<title>Tags</title>'
      contentBox.innerHTML = htmlStr
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
  fadeOutElement(loadingIndicator)
}

async function loadArticlesListAsync () {
  if (articlesList.length === 0) {
    articlesList = await (await window.fetch('/src/json/articleslist.json')).json()
  }
}

async function loadMdPageAsync (filePath) {
  const response = await window.fetch(filePath)
  const markdownStr = response.status === 404
    ? '<h3 style="text-align:center;font-size:7vmin">404 no found</h3><title>404 no found</title>'
    : await response.text()
  contentBox.innerHTML = `<article class="post-body markdown-body">${window.marked(markdownStr)}</article>`
  window.scroll(0, 0)
  afterContentLoads()
}

function afterContentLoads () {
  setTimeout(() => {
    // Fix anchor
    try { document.querySelector(window.location.hash).scrollIntoView() } catch (e) {}

    // Refresh title
    const titleTag = document.querySelector('body title')
    document.title = titleTag
      ? titleTag.textContent + ' - ' + defaultTitle
      : defaultTitle

    // Set listeners
    document.querySelectorAll('[data-sl]').forEach(el => {
      el.removeEventListener('click', onSpaLinkClick)
      el.addEventListener('click', onSpaLinkClick)
    })
  })
}

function onSpaLinkClick () {
  window.history.pushState(null, null, this.dataset.sl)
  loadContentAsync()
}

function fadeInElement (element) {
  element.classList.add('in')
}

function fadeOutElement (element) {
  element.classList.remove('in')
}

sideBar.fadeIn = () => [sideBar, maskLayer].forEach(fadeInElement)
sideBar.fadeOut = () => [sideBar, maskLayer].forEach(fadeOutElement)

loadContentAsync()

window.addEventListener('popstate', loadContentAsync)

document.querySelector('#open-sidebar-btn').addEventListener('click', sideBar.fadeIn)

maskLayer.addEventListener('mousedown', sideBar.fadeOut)

maskLayer.addEventListener('touchstart', sideBar.fadeOut, { passive: true })

document.querySelector('aside ul').addEventListener('click', () => {
  window.scroll(0, 0)
  sideBar.fadeOut()
})

document.querySelector('#gotop-btn').addEventListener('click', () =>
  // window.scroll({ top: 0, behavior: 'smooth' })
  document.lastChild.scrollIntoView({ behavior: 'smooth' })
)

document.querySelector('#open-palette-btn').addEventListener('click', () => {
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
      fadeOutElement(topBar)
    } else {
      fadeInElement(topBar)
    }
    originScrollY = currentScrollY
  }
})())

// Fix the Blink's css bug
setTimeout(() => [sideBar, maskLayer].forEach(el => el.removeAttribute('style')), 700)
