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
let contentElement = document.querySelector('#content');

loadContentAsync();
addEventListener('popstate', loadContentAsync);

// ==============================

let sideBar = (() => {
    let sideBarElement = document.querySelector('aside');
    let maskElement = document.querySelector('#mask');
    return {
        show: () => {
            sideBarElement.classList.add('in');
            maskElement.classList.add('in');
        },
        hide: () => {
            sideBarElement.classList.remove('in');
            maskElement.classList.remove('in');
        }
    };
})();

document.querySelector('#js-open-side-bar').addEventListener('click', sideBar.show);

mask.addEventListener('click', sideBar.hide);

mask.addEventListener('touchstart', sideBar.hide, { passive: true });

document.querySelector('aside>.nav').addEventListener('click', sideBar.hide);

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
    let topBar = document.querySelector('header');
    return () => {
        let relativeScrollY = scrollY - originScrollY;
        originScrollY += relativeScrollY;

        if (relativeScrollY > 0) {
            topBar.classList.add('out');
        } else {
            topBar.classList.remove('out');
        }
    }
})());

// ==============================

async function loadContentAsync() {
    let loadingIndicator = document.querySelector('#loading-indicator');
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
                contentElement.innerHTML = innerHTML;
                afterContentLoads();
                break;
            }
        case 'archive':
            {
                let articleInfoArr = await fetchJsonAsync('/src/json/articleinfo.json');
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
                contentElement.innerHTML = innerHTML;
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

                let innerHTML = '<ul class="posts-list compact">';
                for (let category of categorySingleArr) {
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
                contentElement.innerHTML = innerHTML;
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

                let innerHTML = '<ul class="posts-list compact">';
                for (let tag of tagSingleArr) {
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
                contentElement.innerHTML = innerHTML;
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
    let innerHTML = `<article class=markdown-body>${marked(articleData)}</article>`;
    contentElement.innerHTML = innerHTML;
    scrollTo(0, 0);
    afterContentLoads();
}

function afterContentLoads() {
    // Fix hash scroll
    let selector = location.hash;
    if (selector != '') {
        setTimeout(() => document.querySelector(selector).scrollIntoView());
    }

    // Refresh title
    let titleElementArr = document.querySelectorAll('title');
    document.title = titleElementArr.length > 1
        ? titleElementArr[titleElementArr.length - 1].innerText + ' - ' + defaultTitle
        : defaultTitle;

    // Set listeners
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
    let originScrollX = scrollX; // Keep abscissa
    let originTime = Date.now();
    let passedTime = 0;
    let _scrollToTop = () => {
        if (passedTime < duration) {
            passedTime = Date.now() - originTime;
            requestAnimationFrame(_scrollToTop);
            scrollTo(originScrollX, originScrollY * (1 - easeingFunction(passedTime / duration)));
        }
    };
    _scrollToTop();
}
