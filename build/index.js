/*!
 * kkocdko's blog builder
 * 
 * Version: 20190127
 * 
 * Author: kkocdko
 * 
 * License: Apache License 2.0
 * 
 * Matters:
 * 1. No CRLF support
 */
'use strict';

const fs = require('file-system'); // No native fs
const terser = require('terser');
const htmlminifier = require('html-minifier');
const CleanCss = require('clean-css');
const cleancss = new CleanCss({});

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
    const jsonSaveDir = `${distDir}/src/json`;

    // ==============================

    try {
        fs.rmdirSync(distDir);
    } catch (e) {}

    // ==============================

    let postInfoArr = [];
    for (let articleFile of fs.readdirSync(articleSrcDir)) {
        let articleData = fs.readFileSync(`${articleSrcDir}/${articleFile}`).toString();
        let dateMetaArr = readMeta(articleData, 'date');
        let postInfo = {
            id: dateMetaArr[0].replace(/\-/g, '') + dateMetaArr[1].replace(/\:/g, ''),
            title: readMeta(articleData, 'title')[0],
            date: dateMetaArr[0],
            time: dateMetaArr[1],
            category: readMeta(articleData, 'category')[0],
            tagArr: readMeta(articleData, 'tags'),
            excerpt: readMeta(articleData, 'excerpt')[0],
        };
        postInfoArr.push(postInfo);

        /**
         * Write md file
         */
        fs.writeFileSync(`${articleSaveDir}/${postInfo.id}.md`,
            articleData.replace(/---(.|\n)+?---\n*/, '') +
            `\n<title>${postInfo.title}</title>\n`
        );
    }

    function readMeta(articleData, head, maxSearchLength = 700) {
        articleData = articleData.substr(0, maxSearchLength);
        let line = '';
        try {
            line = articleData.match(`\\n${head}\\:\\s([^\\n]*)`)[1]; // Whole line
        } catch (e) {
            console.error('Can not find this meta');
        }
        let valueArr = line.split(' ');
        return valueArr;
    }

    fs.writeFileSync(`${jsonSaveDir}/articleinfo.json`, JSON.stringify(postInfoArr));

    // ==============================

    fs.recurseSync(devDir, ['src/**/*.js'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFileSync(`${distDir}/${relative}`, terser.minify(fileDataStr).code);
        // fs.writeFileSync(`${distDir}/${relative}`, fileDataStr);
    });

    fs.recurseSync(devDir, ['src/**/*.html', '*.html'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFileSync(`${distDir}/${relative}`,
            htmlminifier.minify(fileDataStr, {
                collapseBooleanAttributes: true,
                removeAttributeQuotes: true,
                removeComments:true,
                collapseWhitespace: true,
                sortAttributes:true,
                sortClassName:true
            })
        );
    });

    fs.recurseSync(devDir, ['src/**/*.css'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFileSync(`${distDir}/${relative}`, cleancss.minify(fileDataStr).styles);
    });

    fs.recurseSync(devDir, ['*.ico', '*.svg', 'toy/**/*.*'], (filepath, relative, filename) => {
        if (!filename) return;
        fs.copyFileSync(filepath, `${distDir}/${relative}`);
    });

    fs.recurseSync(pageSrcDir, ['*.*'], (filepath, relative, filename) => {
        if (!filename) return;
        fs.copyFileSync(filepath, `${pageSaveDir}/${relative}`);
    });

    fs.recurseSync(imageSrcDir, ['*.*'], (filepath, relative, filename) => {
        if (!filename) return;
        fs.copyFileSync(filepath, `${imageSaveDir}/${relative}`);
    });
}


console.time('build');
buildBlog();
console.timeEnd('build');
