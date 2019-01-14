'use strict';

const defaultTitle = 'kkocdko\'s blog';
const contentElement = document.querySelector('#content');
const loadingIndicator = document.querySelector('#loading-indicator');

loadContent();
window.onpopstate = loadContent;

// ==============================

const sideBar = document.querySelector('#side-bar');
const mask = document.querySelector('#mask');

mask.addEventListener('click', () => {
    sideBar.classList.remove('in');
    mask.classList.remove('in');
});

document.querySelector('#open-side-bar').addEventListener('click', () => {
    sideBar.classList.add('in');
    mask.classList.add('in');
});

document.querySelector('#side-bar>.nav').addEventListener('click', () => {
    sideBar.classList.remove('in');
    mask.classList.remove('in');
});

// ==============================

function loadContent() {
    let pathName = location.pathname;
    let firstPath = pathName.split('/')[1];
    switch (firstPath) {
        case 'article':
            let articleId = pathName.split('article/')[1].split('/')[0];
            loadArticle(articleId);
            break;
        case 'home':
            let pageNumber = pathName.split('home/')[1].split('/')[0];
            loadPage('home' + pageNumber);
            break;
        case 'archive':
            loadPage('archive');
            break;
        case 'tag':
            loadPage('tag');
            break;
        case 'category':
            loadPage('category');
            break;
        case 'toy':
            loadPage('toy');
            break;
        case 'about':
            loadPage('about');
            break;
        case 'callingcard':
            loadPage('callingcard');
            break;
        default:
            loadPage('404');
            break;
    }
}

function ajaxGet(url, callback, enableAnimation = false) {
    if (enableAnimation == true) {
        loadingIndicator.classList.add('in');
    }
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            if (enableAnimation == true) {
                loadingIndicator.classList.remove('in');
            }
            callback(xhr.responseText);
        }
    };
    xhr.open('GET', url);
    xhr.send();
}

function loadArticle(fileName) {
    let filePath = `/src/article/${fileName}.md`;
    ajaxGet(filePath, data => {
        contentElement.classList.remove('html-body');
        contentElement.classList.add('markdown-body');
        contentElement.innerHTML = marked(data);
        scrollTo(0, 0);
        refreshListener();
        refreshTitle();
    }, true);
}

function loadPage(fileName) {
    let filePath = `/src/page/${fileName}.html`;
    ajaxGet(filePath, data => {
        contentElement.classList.remove('markdown-body');
        contentElement.classList.add('html-body');
        contentElement.innerHTML = data;
        refreshListener();
        refreshTitle();
    }, true);
}

function refreshTitle() {
    let titleElementArr = document.querySelectorAll('title');
    if (titleElementArr.length > 1) {
        document.title = titleElementArr[titleElementArr.length - 1].innerText + ' - ' + defaultTitle;
    } else {
        document.title = defaultTitle;
    }
}

function refreshListener() {
    let spaLinkElementArr = document.querySelectorAll('[sl]');
    for (let spaLinkElement of spaLinkElementArr) {
        spaLinkElement.onclick = function() {
            history.pushState(null, null, this.getAttribute('sl'));
            loadContent();
        };
    }
}
