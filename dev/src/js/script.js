'use strict';

// new VConsole();

// ==============================

/**
 * Array.prototype.flat polyfill
 * Imperfect, unable to set recursion's depth
 */
if (!Array.prototype.flat) {
    Array.prototype.flat = function(deep = Infinity) {
        return this.reduce((result, item) => {
            result.concat(Array.isArray(item) ? item.flat() : item);
        }, []);
    }
}

// ==============================

let defaultTitle = 'kkocdko\'s blog';
let contentElement = document.querySelector('#content');
let loadingIndicator = document.querySelector('#loading-indicator');

loadContentAsync();
addEventListener('popstate', loadContentAsync);

// ==============================

let sideBar = document.querySelector('#side-bar');
let mask = document.querySelector('#mask');

mask.addEventListener('click', () => {
    sideBar.classList.remove('in');
    mask.classList.remove('in');
});

document.querySelector('#js-open-side-bar').addEventListener('click', () => {
    sideBar.classList.add('in');
    mask.classList.add('in');
});

document.querySelector('#side-bar>.nav').addEventListener('click', () => {
    sideBar.classList.remove('in');
    mask.classList.remove('in');
});

document.querySelector('#js-open-palette').addEventListener('click', () => {
    let color = prompt('Please input color (use css grammar)', 'rgb(0, 150, 136)');
    if (color) {
        document.body.style.setProperty('--theme-color', color);
        document.querySelector('[name=theme-color]').content = color;
    }
});

addEventListener('scroll', (() => {
    let originScrollY = scrollY;
    let topBar = document.querySelector('#top-bar');
    return () => {
        let relativeScrollY = scrollY - originScrollY;
        originScrollY += relativeScrollY;

        topBar.style.transform = `translateY(${relativeScrollY > 0 ? -100 : 0}%)`;
    }
})());

document.querySelector('#js-gotop').addEventListener('click', () => scrollToTop());

// ==============================

async function loadContentAsync() {
    loadingIndicator.classList.add('in');
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
                let articleInfoArr = await fetchJsonAsync('/src/json/articleinfo.json');
                let curPageNumber = Number(pathName.split('home/')[1].split('/')[0]);
                let perPage = 10; // The article quantity of every page
                let pageNumberMax = Math.ceil(articleInfoArr.length / perPage);
                let htmlStr = '<ul class="post-list">';
                for (let i = articleInfoArr.length - 1 - ((curPageNumber - 1) * perPage), min = i - perPage; i > min && i > -1; i--) {
                    let articleInfo = articleInfoArr[i];
                    let tagListStr = '';
                    for (let tag of articleInfo.tagArr) {
                        tagListStr += `<li data-sl="/tag#${tag}">${tag}</li>`;
                    }

                    //                     // Source
                    //                     htmlStr += (`
                    //                         <li>
                    //                             <h3 data-sl="/article/${articleInfo.id}">${articleInfo.title}</h3>
                    //                             <p>${articleInfo.excerpt}</p>
                    //                             <ul class="post-footer">
                    //                                 <li data-sl="/category#${articleInfo.category}">${articleInfo.category}</li>
                    //                                 ${tagListStr}
                    //                             </ul>
                    //                         </li>
                    //                     `);

                    // Compact
                    htmlStr += `<li><h3 data-sl="/article/${articleInfo.id}">${articleInfo.title}</h3><p>${articleInfo.excerpt}</p><ul class="post-footer"><li data-sl="/category#${articleInfo.category}">${articleInfo.category}</li>${tagListStr}</ul></li>`;

                }
                htmlStr += '</ul>';

                //                 // Source
                //                 htmlStr += (`
                //                     <ul class="page-number-nav">
                //                         <li data-sl="/home/1">[◀</li>
                //                         <li data-sl="/home/${(curPageNumber > 1) ? curPageNumber - 1 : 1}">◀</li>
                //                         <li data-sl="/home/${(curPageNumber < pageNumberMax) ? curPageNumber + 1 : pageNumberMax}">▶</li>
                //                         <li data-sl="/home/${pageNumberMax}">▶]</li>
                //                     </ul>
                //                 `);

                // Compact
                htmlStr += `<ul class="page-number-nav"><li data-sl="/home/1">[◀</li><li data-sl="/home/${(curPageNumber > 1) ? curPageNumber - 1 : 1}">◀</li><li data-sl="/home/${(curPageNumber < pageNumberMax) ? curPageNumber + 1 : pageNumberMax}">▶</li><li data-sl="/home/${pageNumberMax}">▶]</li></ul>`;

                htmlStr += `<title>Home: ${curPageNumber}</title>`;
                setContentType('html');
                contentElement.innerHTML = htmlStr;
                afterContentLoads();
                break;
            }
        case 'archive':
            {
                let articleInfoArr = await fetchJsonAsync('/src/json/articleinfo.json');
                let htmlStr = '<ul class="post-list compact">';
                htmlStr += '<li>';
                htmlStr += '<h3>Archive</h3>';
                for (let i = articleInfoArr.length - 1; i > -1; i--) {
                    let articleInfo = articleInfoArr[i]
                    //                 // Source
                    //                     htmlStr += (`
                    //                         <h4 data-sl="/article/${articleInfo.id}">
                    //                             <span>${articleInfo.date}</span>
                    //                             ${articleInfo.title}
                    //                         </h4>
                    //                     `);

                    // Compact
                    htmlStr += `<h4 data-sl="/article/${articleInfo.id}"><span>${articleInfo.date}</span>${articleInfo.title}</h4>`;
                }
                htmlStr += '</li>';
                htmlStr += '</ul>';
                htmlStr += '<title>Archive</title>';
                setContentType('html');
                contentElement.innerHTML = htmlStr;
                afterContentLoads();
            }
            break;
        case 'category':
            {
                let articleInfoArr = await fetchJsonAsync('/src/json/articleinfo.json');
                let categorySingleArr = (() => {
                    let categoryArr = [];
                    for (let article of articleInfoArr) {
                        categoryArr.push(article.category);
                    }
                    return [...new Set(categoryArr)];
                })();
                let categoryMemberArr = {};
                for (let category of categorySingleArr) {
                    categoryMemberArr[category] = {};
                    categoryMemberArr[category].idArr = [];
                    categoryMemberArr[category].titleArr = [];
                }

                for (let articleInfo of articleInfoArr) {
                    let categoryMember = categoryMemberArr[articleInfo.category];
                    categoryMember.idArr.push(articleInfo.id);
                    categoryMember.titleArr.push(articleInfo.title);
                }

                let htmlStr = '<ul class="post-list compact">';
                for (let category of categorySingleArr) {
                    htmlStr += `<li id="${category}">`
                    htmlStr += `<h3>${category}</h3>`;
                    let categoryMember = categoryMemberArr[category];
                    for (let i = 0, l = categoryMember.idArr.length; i < l; i++) {
                        htmlStr += `<h4 data-sl="/article/${categoryMember.idArr[i]}">${categoryMember.titleArr[i]}</h4>`;
                    }
                    htmlStr += '</li>';
                }
                htmlStr += '</ul>';
                htmlStr += '<title>Categories</title>';
                setContentType('html');
                contentElement.innerHTML = htmlStr;
                afterContentLoads();
            }
            break;
        case 'tag':
            {
                let articleInfoArr = await fetchJsonAsync('/src/json/articleinfo.json');
                let tagSingleArr = (() => {
                    let tagArrArr = [];
                    for (let article of articleInfoArr) {
                        tagArrArr.push(article.tagArr);
                    }
                    let tagFlatArr = tagArrArr.flat(Infinity);
                    return [...new Set(tagFlatArr)];
                })();

                let tagMemberArr = {};
                for (let tag of tagSingleArr) {
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

                let htmlStr = '<ul class="post-list compact">';
                for (let tag of tagSingleArr) {
                    htmlStr += `<li id="${tag}">`
                    htmlStr += `<h3>${tag}</h3>`;
                    let tagMember = tagMemberArr[tag];
                    for (let i = 0, l = tagMember.idArr.length; i < l; i++) {
                        htmlStr += `<h4 data-sl="/article/${tagMember.idArr[i]}">${tagMember.titleArr[i]}</h4>`;
                    }
                    htmlStr += '</li>';
                }
                htmlStr += '</ul>';
                htmlStr += '<title>Tags</title>';
                setContentType('html');
                contentElement.innerHTML = htmlStr;
                afterContentLoads();
                break;
            }
        case 'toy':
        case 'about':
        case 'callingcard':
            {
                await loadMdPageAsync(`/src/page/${firstPath}.md`);
                break;
            }
        default:
            {
                await loadMdPageAsync('/src/page/404.md');
                break;
            }
    }
    loadingIndicator.classList.remove('in');
}

async function fetchTextAsync(url) {
    return new Promise(resolve => {
        fetch(url).then(response => {
            resolve(response.text());
        });
    });
}

async function fetchJsonAsync(url) {
    return new Promise(resolve => {
        fetch(url).then(response => {
            resolve(response.json());
        });
    });
};

async function loadMdPageAsync(filePath) {
    let articleData = await fetchTextAsync(filePath);
    setContentType('markdown');
    contentElement.innerHTML = marked(articleData);
    scrollTo(0, 0);
    afterContentLoads();
}

function setContentType(type) {
    switch (type) {
        case 'html':
            contentElement.classList.remove('markdown-body');
            contentElement.classList.add('html-body');
            break;
        case 'markdown':
            contentElement.classList.remove('html-body');
            contentElement.classList.add('markdown-body');
            break;
    }
}

function afterContentLoads() {
    refreshListener();
    refreshTitle();
    fixHashScroll();
}

function fixHashScroll(selector = location.hash) {
//     if (selector != '') {
//         setTimeout(() => document.querySelector(selector).scrollIntoView());
//     }
    if (selector != '') {
        setTimeout(document.querySelector(selector).scrollIntoView);
    }
}

function refreshTitle() {
    let titleElementArr = document.querySelectorAll('title');
    document.title = titleElementArr.length > 1 ?
        titleElementArr[titleElementArr.length - 1].innerText + ' - ' + defaultTitle :
        defaultTitle;
}

function refreshListener() {
    let spaLinkElementArr = document.querySelectorAll('[data-sl]');
    for (let item of spaLinkElementArr) {
        item.onclick = function() {
            history.pushState(null, null, this.dataset.sl);
            loadContentAsync();
        };
    }
}

function scrollToTop(duration = 750) {
    let easeingFunction = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    let originScrollY = scrollY;
    let originTime = Date.now();
    let passedTime = 0;
    let _scrollToTop = () => {
        if (passedTime < duration) {
            passedTime = Date.now() - originTime;
            requestAnimationFrame(_scrollToTop);
            scrollTo({
                top: originScrollY * (1 - easeingFunction(passedTime / duration))
            });
        }
    };
    _scrollToTop();
}
