/*!
 * kkocdko's blog
 * 
 * Author: kkocdko
 * 
 * License: Apache License 2.0
 */
'use strict';

// new VConsole();

// ==============================

/**
 * Array.prototype.flat polyfill
 * Imperfect, unable to set recursion's depth
 */
if (!Array.prototype.flat) {
    Array.prototype.flat = function(deep = Infinity) {
        return this.reduce((accumulator, currentValue) => {
            return accumulator.concat(
                Array.isArray(currentValue)
                ? currentValue.flat()
                : currentValue
            );
        }, []);
    }
}

// ==============================

let defaultTitle = 'KBlog';
let articleInfoArr = [];
let contentEl = document.querySelector('#content');
let loadingEl = document.querySelector('#loading-indicator');
let maskEl = document.querySelector('#mask');
let sideBarEl = document.querySelector('aside');

let showEl = el => el.classList.add('in');
let hideEl = el => el.classList.remove('in');

loadingEl.show = () => showEl(loadingEl);
loadingEl.hide = () => hideEl(loadingEl);
sideBarEl.show = () => [sideBarEl, maskEl].forEach(showEl);
sideBarEl.hide = () => [sideBarEl, maskEl].forEach(hideEl);

// ==============================

document.querySelector('#js-open-side-bar').addEventListener('click', sideBarEl.show);

maskEl.addEventListener('click', sideBarEl.hide);

maskEl.addEventListener('touchstart', sideBarEl.hide, { passive: true });

document.querySelector('aside>.nav').addEventListener('click', sideBarEl.hide);

document.querySelector('#js-gotop').addEventListener('click', () => scrollToTop());

document.querySelector('#js-open-palette').addEventListener('click', () => {
    let color = prompt('Please input color (use css grammar)', 'rgb(156, 39, 176)');
    if (color) {
        document.body.style.setProperty('--theme-color', color);
        document.querySelector('[name=theme-color]').content = color;
    }
});

addEventListener('scroll', (() => {
    let originScrollY = scrollY;
    let topBarEl = document.querySelector('header');
    return () => {
        let relativeScrollY = scrollY - originScrollY;
        originScrollY += relativeScrollY;
        if (relativeScrollY < 0) {
            showEl(topBarEl);
        } else {
            hideEl(topBarEl);
        }
    }
})());

addEventListener('popstate', loadContentAsync);

// ==============================

loadContentAsync();

// ==============================

async function loadContentAsync() {
    loadingEl.show();
    let pathName = location.pathname;
    let firstPath = pathName.split('/')[1];
    switch (firstPath) {
        case 'article':
            {
                let articleId = pathName.split('article/')[1].split('/')[0];
                await loadMdPageAsync(`/src/article/${articleId}.md`);
                break;
            }
        case 'home':
            {
                await loadArticleInfoArrAsync();
                let curPageNumber = Number(pathName.split('home/')[1].split('/')[0]);
                let perPage = 10; // The article quantity of every page
                let pageNumberMax = Math.ceil(articleInfoArr.length / perPage);
                let innerHTML = '<ul class="posts-list">';
                for (let i = articleInfoArr.length - 1 - ((curPageNumber - 1) * perPage), min = i - perPage; i > min && i > -1; i--) {
                    let articleInfo = articleInfoArr[i];
                    let tagListStr = '';
                    for (let tag of articleInfo.tagArr) {
                        tagListStr += `<li data-sl="/tag#${tag}">${tag}</li>`;
                    }

                    // Source
                    // innerHTML += (`
                    //     <li>
                    //         <h3 data-sl="/article/${articleInfo.id}">${articleInfo.title}</h3>
                    //         <p>${articleInfo.excerpt}</p>
                    //         <ul class="post-footer">
                    //             <li data-sl="/category#${articleInfo.category}">${articleInfo.category}</li>
                    //             ${tagListStr}
                    //         </ul>
                    //     </li>
                    // `);

                    // Compact
                    innerHTML += `<li><h3 data-sl="/article/${articleInfo.id}">${articleInfo.title}</h3><p>${articleInfo.excerpt}</p><ul class="post-footer"><li data-sl="/category#${articleInfo.category}">${articleInfo.category}</li>${tagListStr}</ul></li>`;

                }
                innerHTML += '</ul>';

                // Source
                // innerHTML += (`
                //     <ul class="page-number-nav">
                //         <li data-sl="/home/1">[◀</li>
                //         <li data-sl="/home/${(curPageNumber > 1) ? curPageNumber - 1 : 1}">◀</li>
                //         <li data-sl="/home/${(curPageNumber < pageNumberMax) ? curPageNumber + 1 : pageNumberMax}">▶</li>
                //         <li data-sl="/home/${pageNumberMax}">▶]</li>
                //     </ul>
                // `);

                // Compact
                innerHTML += `<ul class="page-number-nav"><li data-sl="/home/1">[◀</li><li data-sl="/home/${(curPageNumber > 1) ? curPageNumber - 1 : 1}">◀</li><li data-sl="/home/${(curPageNumber < pageNumberMax) ? curPageNumber + 1 : pageNumberMax}">▶</li><li data-sl="/home/${pageNumberMax}">▶]</li></ul>`;

                innerHTML += `<title>Home: ${curPageNumber}</title>`;
                contentEl.innerHTML = innerHTML;
                afterContentLoads();
                break;
            }
        case 'archive':
            {
                await loadArticleInfoArrAsync();
                let innerHTML = '<ul class="posts-list compact">';
                innerHTML += '<li>';
                innerHTML += '<h2>Archive</h2>';
                for (let i = articleInfoArr.length - 1; i > -1; i--) {
                    let articleInfo = articleInfoArr[i]
                    // Source
                    // innerHTML += (`
                    //     <h4 data-sl="/article/${articleInfo.id}">
                    //         <span>${articleInfo.date}</span>
                    //          ${articleInfo.title}
                    //     </h4>
                    // `);

                    // Compact
                    innerHTML += `<h4 data-sl="/article/${articleInfo.id}"><span>${articleInfo.date}</span>${articleInfo.title}</h4>`;
                }
                innerHTML += '</li>';
                innerHTML += '</ul>';
                innerHTML += '<title>Archive</title>';
                contentEl.innerHTML = innerHTML;
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

                let categoryMemberArr = {};
                for (let category of categoryArr) {
                    categoryMemberArr[category] = {};
                    categoryMemberArr[category].idArr = [];
                    categoryMemberArr[category].titleArr = [];
                }

                for (let articleInfo of articleInfoArr) {
                    let categoryMember = categoryMemberArr[articleInfo.category];
                    categoryMember.idArr.push(articleInfo.id);
                    categoryMember.titleArr.push(articleInfo.title);
                }

                let innerHTML = '<ul class="posts-list compact">';
                for (let category of categoryArr) {
                    innerHTML += `<li id="${category}">`
                    innerHTML += `<h2>${category}</h2>`;
                    let categoryMember = categoryMemberArr[category];
                    for (let i = 0, l = categoryMember.idArr.length; i < l; i++) {
                        innerHTML += `<h4 data-sl="/article/${categoryMember.idArr[i]}">${categoryMember.titleArr[i]}</h4>`;
                    }
                    innerHTML += '</li>';
                }
                innerHTML += '</ul>';
                innerHTML += '<title>Categories</title>';
                contentEl.innerHTML = innerHTML;
                afterContentLoads();
            }
            break;
        case 'tag':
            {
                await loadArticleInfoArrAsync();
                let tagArr = [];
                for (let article of articleInfoArr) {
                    tagArr.push(article.tagArr);
                }
                tagArr = tagArr.flat(Infinity);
                tagArr = [...new Set(tagArr)];

                let tagMemberArr = {};
                for (let tag of tagArr) {
                    tagMemberArr[tag] = {};
                    tagMemberArr[tag].idArr = [];
                    tagMemberArr[tag].titleArr = [];
                }

                for (let articleInfo of articleInfoArr) {
                    for (let tag of articleInfo.tagArr) {
                        tagMemberArr[tag].idArr.push(articleInfo.id);
                        tagMemberArr[tag].titleArr.push(articleInfo.title);
                    }
                }

                let innerHTML = '<ul class="posts-list compact">';
                for (let tag of tagArr) {
                    innerHTML += `<li id="${tag}">`
                    innerHTML += `<h2>${tag}</h2>`;
                    let tagMember = tagMemberArr[tag];
                    for (let i = 0, l = tagMember.idArr.length; i < l; i++) {
                        innerHTML += `<h4 data-sl="/article/${tagMember.idArr[i]}">${tagMember.titleArr[i]}</h4>`;
                    }
                    innerHTML += '</li>';
                }
                innerHTML += '</ul>';
                innerHTML += '<title>Tags</title>';
                contentEl.innerHTML = innerHTML;
                afterContentLoads();
                break;
            }
        case 'toy':
        case 'about':
        case 'callingcard':
            await loadMdPageAsync(`/src/page/${firstPath}.md`);
            break;
        default:
            await loadMdPageAsync('/src/page/404.md');
            break;
    }
    loadingEl.hide();
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
    let innerHTML = `<article class="markdown-body">${marked(articleData)}</article>`;
    contentEl.innerHTML = innerHTML;
    scrollTo(0, 0);
    afterContentLoads();
}

function afterContentLoads() {
    // Fix hash anchor
    let anchorEl = document.querySelector(location.hash || '--');
    if (anchorEl) anchorEl.scrollIntoView();

    // Refresh title
    let titleElArr = document.querySelectorAll('title');
    document.title = titleElArr.length > 1
        ? titleElArr[titleElArr.length - 1].innerText + ' - ' + defaultTitle
        : defaultTitle;

    // Set listeners
    let spaLinkElArr = document.querySelectorAll('[data-sl]');
    for (let spaLinkEl of spaLinkElArr) {
        spaLinkEl.onclick = function() {
            history.pushState(null, null, this.dataset.sl);
            loadContentAsync();
        };
    }
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
