/*!
 * kkocdko's blog builder
 * 
 * Version: 20190119
 * 
 * Author: kkocdko
 * 
 * License: Apache License 2.0
 * 
 * Matters:
 * 1. No CRLF support
 * 2. No auto compression
 */
'use strict';

const fs = require('fs');

fs.copydirSync = (srcDir, targetDir) => {
    // Slow, windows only, but stable
    const child_process = require('child_process');
    if (fs.existsSync(targetDir)) {
        child_process.execSync(`rd /s /q "${targetDir}"`);
    }
    try {
        // I don't know why throw error, it works so well
        child_process.execSync(`robocopy /e "${srcDir}" "${targetDir}"`);
    } catch (e) {}
};

function buildBlog(
    projectDir = 'E:/Code/Repos/Web/Blog'
) {
    // ===============================

    const imageSrcDir = `${projectDir}/_img`;
    const articleSrcDir = `${projectDir}/_post`;
    const pageSrcDir = `${projectDir}/_page`;

    const devDir = `${projectDir}/dev`;
    const distDir = `${projectDir}/dist`;

    const imageSaveDir = `${distDir}/src/img`;
    const articleSaveDir = `${distDir}/src/article`;
    const pageSaveDir = `${distDir}/src/page`;

    // ==============================

    fs.copydirSync(devDir, distDir);

    /**
     * Read articles' infomation
     */
    function readMeta(articleData, head) {
        let line = '';
        try {
            line = articleData.match(`\\n${head}\\:\\s([^\\n]*)`)[1]; // Whole line
        } catch (e) {
            console.error('Can not find this meta');
        }
        let valueArr = line.split(' ');
        return valueArr;
    }

    function getID(dateMetaArr) {
        let dateStr = dateMetaArr[0].replace(/\-/g, '');
        let timeStr = dateMetaArr[1].replace(/\:/g, '');
        let id = dateStr + timeStr;
        return id;
    }

    let idArr = [];
    let titleArr = [];
    let dateStrArr = [];
    let timeStrArr = [];
    let categoryArr = [];
    let tagArrArr = [];
    let excerptArr = [];
    let articleFileArr = fs.readdirSync(articleSrcDir);
    for (let articleFile of articleFileArr) {
        let articleData = fs.readFileSync(`${articleSrcDir}/${articleFile}`).toString();
        let dateMetaArr = readMeta(articleData, 'date');
        dateStrArr.push(dateMetaArr[0]);
        timeStrArr.push(dateMetaArr[1]);
        let articleId = getID(dateMetaArr);
        idArr.push(articleId);
        let articleTitle = readMeta(articleData, 'title')[0];
        titleArr.push(articleTitle);
        categoryArr.push(readMeta(articleData, 'category')[0]);
        tagArrArr.push(readMeta(articleData, 'tags'));
        excerptArr.push(readMeta(articleData, 'excerpt'))[0];
        fs.writeFileSync(`${articleSaveDir}/${articleId}.md`,
            articleData.replace(/---(.|\n)+?---\n*/, '') +
            `\n<title>${articleTitle}</title>\n`
        );
    }

    /**
     * Build home pages
     */
    let perPage = 10; // The article quantity of every page
    let pageNumber = 0;
    let pageNumberMax = Math.ceil(idArr.length / perPage);
    for (let i = idArr.length - 1; i > -1; i -= perPage) {
        let homeHtmlStr = '<ul class="post-list">';
        for (let j = i, min = i - perPage; j > min && j > -1; j--) {
            let tagListStr = '';
            for (let tag of tagArrArr[j]) {
                tagListStr += `<li data-sl="/tag#${tag}">${tag}</li>`;
            }
            homeHtmlStr +=
                `
            <li>
                <h3 data-sl="/article/${idArr[j]}">${titleArr[j]}</h3>
                <p>${excerptArr[j]}</p>
                <ul class="footer">
                    <li data-sl="/category#${categoryArr[j]}">${categoryArr[j]}</li>
                    ${tagListStr}
                </ul>
            </li>
            `;
        }
        homeHtmlStr += '</ul>';

        pageNumber++;
        homeHtmlStr +=
            `
        <ul class="page-number-nav">
            <li data-sl="/home/1">[◀</li>
            <li data-sl="/home/${(pageNumber > 1) ? pageNumber - 1 : 1}">◀</li>
            <li data-sl="/home/${(pageNumber < pageNumberMax) ? pageNumber + 1 : pageNumberMax}">▶</li>
            <li data-sl="/home/${pageNumberMax}">▶]</li>
        </ul>
        `;
        homeHtmlStr += `<title>Home: ${pageNumber}</title>`;
        fs.writeFileSync(`${pageSaveDir}/home${pageNumber}.html`, homeHtmlStr);
    }

    /**
     * Build archive page
     */
    /* 
         let archiveHtmlStr = '<ul class="post-list compact">';
        for (let i = idArr.length - 1; i > -1; i++) {

        }
        for (let category of categorySingleArr) {
            categoryHtmlStr += `<li id="${category}">`
            categoryHtmlStr += `<h3>${category}</h3>`;
            for (let i in categoryMemberArr[category].idArr) {
                categoryHtmlStr += `<h4 data-sl="/article/${categoryMemberArr[category].idArr[i]}">${categoryMemberArr[category].titleArr[i]}</h4>`;
            }
            categoryHtmlStr += '</li>';
        }
        categoryHtmlStr += '</ul>';
        categoryHtmlStr += '<title>Categories</title>';
        fs.writeFileSync(`${pageSaveDir}/category.html`, categoryHtmlStr);
     */

    /**
     * Build category page
     */
    let categorySingleArr = [...new Set(categoryArr)];
    let categoryMemberArr = {};
    for (let category of categorySingleArr) {
        categoryMemberArr[category] = {};
        categoryMemberArr[category].idArr = [];
        categoryMemberArr[category].titleArr = [];
    }

    for (let i in categoryArr) {
        let category = categoryArr[i];
        categoryMemberArr[category].idArr.push(idArr[i]);
        categoryMemberArr[category].titleArr.push(titleArr[i]);
    }

    let categoryHtmlStr = '<ul class="post-list compact">';
    for (let category of categorySingleArr) {
        categoryHtmlStr += `<li id="${category}">`
        categoryHtmlStr += `<h3>${category}</h3>`;
        for (let i in categoryMemberArr[category].idArr) {
            categoryHtmlStr += `<h4 data-sl="/article/${categoryMemberArr[category].idArr[i]}">${categoryMemberArr[category].titleArr[i]}</h4>`;
        }
        categoryHtmlStr += '</li>';
    }
    categoryHtmlStr += '</ul>';
    categoryHtmlStr += '<title>Categories</title>';
    fs.writeFileSync(`${pageSaveDir}/category.html`, categoryHtmlStr);

    /**
     * Build tag page
     */
    let tagFlatArr = tagArrArr.flat(Infinity);
    let tagSingleArr = [...new Set(tagFlatArr)];
    let tagMemberArr = {};
    for (let tag of tagSingleArr) {
        tagMemberArr[tag] = {};
        tagMemberArr[tag].idArr = [];
        tagMemberArr[tag].titleArr = [];
    }

    for (let i in tagArrArr) {
        for (let tag of tagArrArr[i]) {
            tagMemberArr[tag].idArr.push(idArr[i]);
            tagMemberArr[tag].titleArr.push(titleArr[i]);
        }
    }

    let tagHtmlStr = '<ul class="post-list compact">';
    for (let tag of tagSingleArr) {
        tagHtmlStr += `<li id="${tag}">`
        tagHtmlStr += `<h3>${tag}</h3>`;
        for (let i in tagMemberArr[tag].idArr) {
            tagHtmlStr += `<h4 data-sl="/article/${tagMemberArr[tag].idArr[i]}">${tagMemberArr[tag].titleArr[i]}</h4>`;
        }
        tagHtmlStr += '</li>';
    }
    tagHtmlStr += '</ul>';
    tagHtmlStr += '<title>Tags</title>';
    fs.writeFileSync(`${pageSaveDir}/tag.html`, tagHtmlStr);

    /**
     * Copy images
     */
    fs.copydirSync(imageSrcDir, imageSaveDir);

    // ==============================
}

console.time('build');
buildBlog();
console.timeEnd('build');
