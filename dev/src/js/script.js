'use strict'

// ==============================

const defaultTitle = document.title
let articlesList = []

const contentBox = document.querySelector('#content')
const loadingIndicator = document.querySelector('#loading-indicator')
const mask = document.querySelector('#mask')
const topBar = document.querySelector('header')
const sideBar = document.querySelector('aside')

const fadeInEl = el => el.classList.add('in')
const fadeOutEl = el => el.classList.remove('in')

loadingIndicator.fadeIn = () => fadeInEl(loadingIndicator)
loadingIndicator.fadeOut = () => fadeOutEl(loadingIndicator)
sideBar.fadeIn = () => [sideBar, mask].forEach(fadeInEl)
sideBar.fadeOut = () => [sideBar, mask].forEach(fadeOutEl)

// ==============================

// Fix the Blink's css bug
setTimeout(() => { sideBar.style.display = mask.style.display = 'unset' }, 700)

// ==============================

loadContentAsync()

// ==============================

document.querySelector('#js-open-side-bar').addEventListener('click', sideBar.fadeIn)

mask.addEventListener('mousedown', sideBar.fadeOut)

mask.addEventListener('touchstart', sideBar.fadeOut, { passive: true })

document.querySelector('aside>.nav').addEventListener('click', () => {
  window.scrollTo(0, 0)
  sideBar.fadeOut()
})

document.querySelector('#js-gotop').addEventListener('click', () =>
  document.documentElement.scrollIntoView({ behavior: 'smooth' })
)

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
      fadeOutEl(topBar)
    } else {
      fadeInEl(topBar)
    }
    originScrollY = currentScrollY
  }
})())

window.addEventListener('popstate', loadContentAsync)

// ==============================

async function loadContentAsync () {
  loadingIndicator.fadeIn()
  const pathName = window.location.pathname
  const firstPath = pathName.split('/')[1]
  switch (firstPath) {
    case 'article': {
      const articleId = pathName.split('article/')[1].split('/')[0]
      await loadMdPageAsync(`/src/article/${articleId}.md`)
      break
    }
    case 'home': {
      await loadArticlesListAsync()

      const curPageNumber = Number(pathName.split('home/')[1].split('/')[0])
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

      const categoriesList = [...new Set(
        articlesList.map(({ category }) => category)
      )]
      const articlesListByCategory = new Map(categoriesList.map(category =>
        [category, []]
      ))
      articlesList.forEach(({ id, title, category }) => {
        articlesListByCategory.get(category).push({ id, title })
      })

      let htmlStr = '<ul class="post-list compact">'
      articlesListByCategory.forEach((list, category) => {
        htmlStr +=
          `<li id="${category}">` +
          `<h2>${category}</h2>`
        list.forEach(({ id, title }) => {
          htmlStr += `<h4 data-sl="/article/${id}">${title}</h4>`
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

      // const tagsList = [...new Set(articlesList.flatMap(({ tagsList }) => tagsList))]
      const tagsListSet = new Set()
      articlesList.forEach(({ tagsList }) => {
        tagsList.forEach(tag => { tagsListSet.add(tag) })
      })
      const tagsList = [...tagsListSet]
      const articlesListByTag = new Map(tagsList.map(tag =>
        [tag, []]
      ))
      articlesList.forEach(({ id, title, tagsList }) => {
        tagsList.forEach(tag => {
          articlesListByTag.get(tag).push({ id, title })
        })
      })

      let htmlStr = '<ul class="post-list compact">'
      articlesListByTag.forEach((list, tag) => {
        htmlStr +=
          `<li id="${tag}">` +
          `<h2>${tag}</h2>`
        list.forEach(({ id, title }) => {
          htmlStr += `<h4 data-sl="/article/${id}">${title}</h4>`
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
  loadingIndicator.fadeOut()
}

async function loadArticlesListAsync () {
  if (articlesList.length === 0) {
    const response = await window.fetch('/src/json/articleslist.json')
    articlesList = await response.json()
  }
}

async function loadMdPageAsync (filePath) {
  const response = await window.fetch(filePath)
  const markdownStr = response.status === 404
    ? '<h3 style="text-align:center;font-size:7vmin">404 no found</h3><title>404 no found</title>'
    : await response.text()
  const htmlStr = `<div class="post-body"><article class="markdown-body">${window.marked(markdownStr)}</article></div>`
  contentBox.innerHTML = htmlStr
  window.scrollTo(0, 0)
  afterContentLoads()
}

function afterContentLoads () {
  setTimeout(() => {
    // Fix anchor
    const anchorElement = document.querySelector(window.location.hash || '--')
    if (anchorElement) {
      anchorElement.scrollIntoView()
    }

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
