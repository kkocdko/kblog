/*!
 * kkocdko's blog builder
 * 
 * Version: 20190216
 * 
 * Author: kkocdko
 * 
 * License: Apache License 2.0
 * 
 * Matters:
 * 1. No CRLF support
 * 2. Absolute path only
 */
'use strict';

const fs = require('file-system'); // No native fs
const terser = require('terser');
const htmlminifier = require('html-minifier');
const CleanCss = require('clean-css');
const cleancss = new CleanCss({});

function buildBlog(
    projectDir = 'E:/Code/Repos/Web/Blog',
    developMode = false
) {
    const imageSrcDir = `${projectDir}/_img`;
    const articleSrcDir = `${projectDir}/_post`;
    const pageSrcDir = `${projectDir}/_page`;

    const devDir = `${projectDir}/dev`;
    const distDir = `${projectDir}/dist`;

    const imageSaveDir = `${distDir}/src/img`;
    const articleSaveDir = `${distDir}/src/article`;
    const pageSaveDir = `${distDir}/src/page`;
    const jsonSaveDir = `${distDir}/src/json`;

    // ==============================

    try {
        fs.rmdirSync(distDir);
    } catch (e) {}

    // ==============================

    let postInfoArr = [];
    let articleFileArr = fs.readdirSync(articleSrcDir);
    for (let articleFile of articleFileArr) {
        let articleData = fs.readFileSync(`${articleSrcDir}/${articleFile}`).toString();
        let dateMetaArr = readMeta(articleData, 'date');
        let postInfo = {
            id: dateMetaArr[0].replace(/\-/g, '') + dateMetaArr[1].replace(/\:/g, ''),
            title: readMeta(articleData, 'title')[0],
            date: dateMetaArr[0],
            time: dateMetaArr[1],
            category: readMeta(articleData, 'category')[0],
            tagArr: readMeta(articleData, 'tags'),
            excerpt: readMeta(articleData, 'excerpt', '\n')[0],
        };
        postInfoArr.push(postInfo);

        /**
         * Write md file
         */
        fs.writeFile(`${articleSaveDir}/${postInfo.id}.md`,
            articleData.replace(/---(.|\n)+?---\n*/, '') +
            `\n<title>${postInfo.title}</title>\n`
        );
    }

    function readMeta(articleData, head, spliter = ' ', maxSearchLength = 700) {
        articleData = articleData.substr(0, maxSearchLength);
        let line = '';
        try {
            line = articleData.match(`\\n${head}\\:\\s([^\\n]*)`)[1]; // Whole line
        } catch (e) {
            console.error('Can not find this meta');
        }
        let valueArr = line.split(spliter);
        return valueArr;
    }

    fs.writeFile(`${jsonSaveDir}/articleinfo.json`, JSON.stringify(postInfoArr));

    // ==============================

    fs.recurse(devDir, ['src/**/*.js'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode) ?
            fileDataStr :
            terser.minify(fileDataStr).code
        );
    });

    fs.recurse(devDir, ['src/**/*.html', '*.html'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode) ?
            fileDataStr :
            htmlminifier.minify(fileDataStr, {
                collapseBooleanAttributes: true,
                removeAttributeQuotes: true,
                removeComments: true,
                collapseWhitespace: true,
                sortAttributes: true,
                sortClassName: true
            })
        );
    });

    fs.recurse(devDir, ['src/**/*.css'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode) ?
            fileDataStr :
            cleancss.minify(fileDataStr).styles
        );

    });

    fs.recurse(devDir, ['*.ico', '*.txt', '*.svg', 'toy/**/*.*'], (filepath, relative, filename) => {
        if (!filename) return;
        fs.copyFile(filepath, `${distDir}/${relative}`);
    });

    fs.recurse(pageSrcDir, ['*.*'], (filepath, relative, filename) => {
        if (!filename) return;
        fs.copyFile(filepath, `${pageSaveDir}/${relative}`);
    });

    fs.recurse(imageSrcDir, ['*.*'], (filepath, relative, filename) => {
        if (!filename) return;
        fs.copyFile(filepath, `${imageSaveDir}/${relative}`);
    });
}


console.time('build');
buildBlog();

process.on('exit', () => {
    console.timeEnd('build');
});
