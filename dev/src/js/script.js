'use strict';

let defaultTitle = 'KBlog';
let articleInfoArr = [];

let contentEl = document.querySelector('#content');
let loadingEl = document.querySelector('#loading-indicator');
let maskEl = document.querySelector('#mask');
let topBarEl = document.querySelector('header');
let sideBarEl = document.querySelector('aside');

let fadeInEl = el => el.classList.add('in');
let fadeOutEl = el => el.classList.remove('in');

loadingEl.fadeIn = () => fadeInEl(loadingEl);
loadingEl.fadeOut = () => fadeOutEl(loadingEl);
sideBarEl.fadeIn = () => [sideBarEl, maskEl].forEach(fadeInEl);
sideBarEl.fadeOut = () => [sideBarEl, maskEl].forEach(fadeOutEl);

// ==============================

document.querySelector('#js-open-side-bar').addEventListener('click', sideBarEl.fadeIn);

maskEl.addEventListener('click', sideBarEl.fadeOut);

maskEl.addEventListener('touchstart', sideBarEl.fadeOut, { passive: true });

document.querySelector('aside>.nav').addEventListener('click', sideBarEl.fadeOut);

document.querySelector('#js-gotop').addEventListener('click', () => scrollToTop());

document.querySelector('#js-open-palette').addEventListener('click', () => {
    let color = prompt('Please input color (use css grammar)', 'rgb(156, 39, 176)');
    if (color) {
        document.body.style.setProperty('--theme-color', color);
        document.querySelector('meta[name=theme-color]').content = color;
        sideBarEl.fadeOut();
    }
});

addEventListener('scroll', (() => {
    let originScrollY = scrollY;
    let currentScrollY = originScrollY;
    return () => {
        currentScrollY = scrollY;
        if (originScrollY < currentScrollY) {
            fadeOutEl(topBarEl);
        } else {
            fadeInEl(topBarEl);
        }
        originScrollY = currentScrollY;
    }
})());

addEventListener('popstate', loadContentAsync);

// ==============================

loadContentAsync();

// ==============================

async function loadContentAsync() {
    loadingEl.fadeIn();
    let pathName = location.pathname;
    let firstPath = pathName.split('/')[1];
    switch (firstPath) {
        case 'article':
            {
                let articleId = pathName.match(/(?<=\/article\/)\d+/)[0];
                await loadMdPageAsync(`/src/article/${articleId}.md`);
            }
            break;
        case 'home':
            {
                await loadArticleInfoArrAsync();
                let curPageNumber = Number(pathName.match(/(?<=\/home\/)\d+/)[0]);
                let perPage = 10; // The article quantity of every page
                let pageNumberMax = Math.ceil(articleInfoArr.length / perPage);
                let htmlStr = '<ul class="posts-list">';
                for (let i = articleInfoArr.length - 1 - ((curPageNumber - 1) * perPage), min = i - perPage; i > min && i > -1; i--) {
                    let article = articleInfoArr[i];
                    let tagListStr = '';
                    for (let tag of article.tagArr) {
                        tagListStr += `<li data-sl="/tag#${tag}">${tag}</li>`;
                    }

                    // Source
                    // htmlStr += `
                    //     <li>
                    //         <h3 data-sl="/article/${article.id}">${article.title}</h3>
                    //         <p>${article.excerpt}</p>
                    //         <ul class="post-footer">
                    //             <li data-sl="/category#${article.category}">${article.category}</li>
                    //             ${tagListStr}
                    //         </ul>
                    //     </li>
                    // `;

                    // Compact
                    htmlStr += `<li><h3 data-sl="/article/${article.id}">${article.title}</h3><p>${article.excerpt}</p><ul class="post-footer"><li data-sl="/category#${article.category}">${article.category}</li>${tagListStr}</ul></li>`;

                }
                htmlStr += '</ul>';

                // Source
                // htmlStr += `
                //     <ul class="page-number-nav">
                //         <li data-sl="/home/1">[◀</li>
                //         <li data-sl="/home/${(curPageNumber > 1) ? curPageNumber - 1 : 1}">◀</li>
                //         <li data-sl="/home/${(curPageNumber < pageNumberMax) ? curPageNumber + 1 : pageNumberMax}">▶</li>
                //         <li data-sl="/home/${pageNumberMax}">▶]</li>
                //     </ul>
                // `;

                // Compact
                htmlStr += `<ul class="page-number-nav"><li data-sl="/home/1">[◀</li><li data-sl="/home/${(curPageNumber > 1) ? curPageNumber - 1 : 1}">◀</li><li data-sl="/home/${(curPageNumber < pageNumberMax) ? curPageNumber + 1 : pageNumberMax}">▶</li><li data-sl="/home/${pageNumberMax}">▶]</li></ul>`;

                htmlStr += `<title>Home: ${curPageNumber}</title>`;
                contentEl.innerHTML = htmlStr;
                afterContentLoads();
            }
            break;
        case 'archive':
            {
                await loadArticleInfoArrAsync();
                let htmlStr = '<ul class="posts-list compact">';
                htmlStr += '<li>';
                htmlStr += '<h2>Archive</h2>';
                for (let i = articleInfoArr.length - 1; i > -1; i--) {
                    let article = articleInfoArr[i];
                    // Source
                    // htmlStr += `
                    //     <h4 data-sl="/article/${article.id}">
                    //         <span class="post-date">${article.date}</span>
                    //          ${article.title}
                    //     </h4>
                    // `;

                    // Compact
                    htmlStr += `<h4 data-sl="/article/${article.id}"><span class="post-date">${article.date}</span>${article.title}</h4>`;
                }
                htmlStr += '</li>';
                htmlStr += '</ul>';
                htmlStr += '<title>Archive</title>';
                contentEl.innerHTML = htmlStr;
                afterContentLoads();
            }
            break;
        case 'category':
            {
                await loadArticleInfoArrAsync();
                let categoryArr = [];
                for (let article of articleInfoArr) {
                    categoryArr.push(article.category);
                }
                categoryArr = [...new Set(categoryArr)];

                let articleArrByCategory = {};
                for (let category of categoryArr) {
                    articleArrByCategory[category] = [];
                }

                for (let article of articleInfoArr) {
                    articleArrByCategory[article.category].push({
                        id: article.id,
                        title: article.title
                    });
                }

                let htmlStr = '<ul class="posts-list compact">';
                for (let i = categoryArr.length - 1; i > -1; i--) {
                    let category = categoryArr[i];
                    htmlStr += `<li id="${category}">`
                    htmlStr += `<h2>${category}</h2>`;
                    let articleArr = articleArrByCategory[category];
                    for (let i = articleArr.length - 1; i > -1; i--) {
                        let article = articleInfoArr[i];
                        htmlStr += `<h4 data-sl="/article/${article.id}">${article.title}</h4>`;
                    }
                    htmlStr += '</li>';
                }
                htmlStr += '</ul>';
                htmlStr += '<title>Categories</title>';
                contentEl.innerHTML = htmlStr;
                afterContentLoads();
            }
            break;
        case 'tag':
            {
                await loadArticleInfoArrAsync();
                let tagArr = [];
                for (let article of articleInfoArr) {
                    tagArr.push(...article.tagArr);
                }
                tagArr = [...new Set(tagArr)];

                let articleArrByTag = {};
                for (let tag of tagArr) {
                    articleArrByTag[tag] = [];
                }

                for (let article of articleInfoArr) {
                    for (let tag of article.tagArr) {
                        articleArrByTag[tag].push({
                            id: article.id,
                            title: article.title
                        });
                    }
                }

                let htmlStr = '<ul class="posts-list compact">';
                for (let i = tagArr.length - 1; i > -1; i--) {
                    let tag = tagArr[i];
                    htmlStr += `<li id="${tag}">`
                    htmlStr += `<h2>${tag}</h2>`;
                    let articleArr = articleArrByTag[tag];
                    for (let i = articleArr.length - 1; i > -1; i--) {
                        let article = articleArr[i];
                        htmlStr += `<h4 data-sl="/article/${article.id}">${article.title}</h4>`;
                    }
                    htmlStr += '</li>';
                }
                htmlStr += '</ul>';
                htmlStr += '<title>Tags</title>';
                contentEl.innerHTML = htmlStr;
                afterContentLoads();
            }
            break;
        case 'toy':
        case 'callingcard':
        case 'about':
        case '404':
            await loadMdPageAsync(`/src/page/${firstPath}.md`);
            break;
        default:
            jumpToSpaLink('/404');
            break;
    }
    loadingEl.fadeOut();
}

async function loadArticleInfoArrAsync() {
    if (articleInfoArr.length == 0) {
        let response = await fetch(`/src/json/articleinfo.json`);
        articleInfoArr = await response.json();
    }
}

async function loadMdPageAsync(filePath) {
    let response = await fetch(filePath);
    let articleData = await response.text();
    let htmlStr = `<div class="post-body"><article class="markdown-body">${marked(articleData)}</article></div>`;
    contentEl.innerHTML = htmlStr;
    afterContentLoads();
}

function jumpToSpaLink(spaLink) {
    if (typeof spaLink != 'string') {
        spaLink = this.dataset.sl;
    }
    history.pushState(null, null, spaLink);
    loadContentAsync();
}

function afterContentLoads() {
    scrollTo(0, 0);

    // Fix hash anchor
    let anchorEl = document.querySelector(location.hash || '--');
    if (anchorEl) {
        anchorEl.scrollIntoView();
    }

    setTimeout(() => {
        // Refresh title
        let titleElArr = document.querySelectorAll('title');
        document.title = titleElArr.length > 1
            ? titleElArr[titleElArr.length - 1].innerText + ' - ' + defaultTitle
            : defaultTitle;

        // Set listeners
        document.querySelectorAll('[data-sl]').forEach(el => {
            el.removeEventListener('click', jumpToSpaLink);
            el.addEventListener('click', jumpToSpaLink);
        });
    });
}

function scrollToTop(duration = 700) {
    let easeingFunction = t => --t * t * t + 1;
    let originScrollY = scrollY;
    // let originScrollX = scrollX; // Keep abscissa
    let originTime = Date.now();
    let passedTime = 0;
    let _scrollToTop = () => {
        if (passedTime < duration) {
            passedTime = Date.now() - originTime;
            requestAnimationFrame(_scrollToTop);
            // scrollTo(originScrollX, originScrollY * (1 - easeingFunction(passedTime / duration)));
            scrollTo(0, originScrollY * (1 - easeingFunction(passedTime / duration)));
        }
    };
    _scrollToTop();
}
