'use strict';

const fs = require('fs');

fs.copydirSync = (srcDir, targetDir) => {
    // Slow, windows only, but stable
    const child_process = require('child_process');
    if (fs.existsSync(targetDir)) {
        child_process.execSync(`rd /s /q "${targetDir}"`);
    }
    // child_process.execFileSync('robocopy', ['/e', srcDir, targetDir]);
    try {
        // I don't know why throw error, it works so well
        child_process.execSync(`robocopy /e "${srcDir}" "${targetDir}"`);
    } catch (e) {}
};

function buildBlog(
    projectDir = 'E:/Code/Repos/Web/Blog'
) {
    // ==============================

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

    // ==============================

    function readMeta(articleData, head) {
        let line = '';
        try {
            line = articleData.match(`\\n${head}\\:\\s([^(\\n|\\r)]*)`)[1]; // Whole line
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
            articleData.replace(/---(.|\n|\r)+?---(\n|\r)*/, '') +
            `\n<title>${articleTitle}</title>\n`
        );
    }

    // ==============================

    let perPage = 10; // The article quantity of every page
    let pageNumber = 1;
    for (let i = articleFileArr.length - 1; i > -1; i -= perPage) {
        let homeHtmlStr = '<ul class="post-list">';
        for (let j = i, min = i - perPage; j > min && j > -1; j--) {
            let tagListStr = '';
            for (let tag of tagArrArr[j]) {
                tagListStr += `<li sl="/tag#${tag}">${tag}</li>`;
            }
            homeHtmlStr +=
                `
            <li>
                <h3 sl="/article/${idArr[j]}">${titleArr[j]}</h3>
                <p>${excerptArr[j]}</p>
                <ul class="footer">
                    <li sl="/category#${categoryArr[j]}">${categoryArr[j]}</li>
                    ${tagListStr}
                </ul>
            </li>
            `;
        }
        homeHtmlStr += '\n</ul>';
        homeHtmlStr += `<title>Home: ${pageNumber}</title>`;
        fs.writeFileSync(`${pageSaveDir}/home${pageNumber}.html`, homeHtmlStr);
        pageNumber++;
    }

    // ==============================

    fs.copydirSync(imageSrcDir, imageSaveDir);

    // ==============================
}

console.time('build');
buildBlog();
console.timeEnd('build');
