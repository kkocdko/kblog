/*!
 * kkocdko's blog builder
 * 
 * Version: 20190223
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
const cleancss = new(require('clean-css'))({});

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
    } catch {}

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

    fs.writeFile(`${jsonSaveDir}/articleinfo.json`, JSON.stringify(postInfoArr));

    function readMeta(articleData, head, spliter = ' ', maxSearchLength = 700) {
        articleData = articleData.substr(0, maxSearchLength);
        let line = '';
        try {
            line = articleData.match(`\\n${head}:([^\\n]*)`)[1].trim(); // Whole line
        } catch (e) {
            console.error('Can not find this meta');
        }
        let valueArr = line.split(spliter);
        return valueArr;
    }

    // ==============================

    fs.recurse(devDir, ['src/**/*.html', '*.html'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode) ?
            fileDataStr :
            fileDataStr.replace(/<!--(.|\n)*?-->|(?<=>)(\s|\n)+/g, '') // No inline css or js support!
        );
    });

    fs.recurse(devDir, ['src/**/*.css'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode || filename.indexOf('.min.') != -1) ? // Filename has minimized mark
            fileDataStr :
            cleancss.minify(fileDataStr).styles
        );
    });

    fs.recurse(devDir, ['src/**/*.js'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode || filename.indexOf('.min.') != -1) ? // Filename has minimized mark
            fileDataStr :
            terser.minify(fileDataStr).code
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
process.on('exit', () => console.timeEnd('build'));
