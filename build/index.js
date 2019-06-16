/*!
 * kkocdko's blog builder
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

let fs = require('file-system'); // No native fs
let terser = require('terser');
let cleancss = require('clean-css');

function buildBlog(
    projectDir = `${__dirname}/..`,
    developMode = false
) {
    let imageSrcDir = `${projectDir}/_img`;
    let articleSrcDir = `${projectDir}/_post`;
    let pageSrcDir = `${projectDir}/_page`;

    let devDir = `${projectDir}/dev`;
    let distDir = `${projectDir}/dist`;

    let imageSaveDir = `${distDir}/src/img`;
    let articleSaveDir = `${distDir}/src/article`;
    let pageSaveDir = `${distDir}/src/page`;
    let jsonSaveDir = `${distDir}/src/json`;

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

        // Write compact markdown file
        fs.writeFile(`${articleSaveDir}/${postInfo.id}.md`,
            `<h2 class=lite>${postInfo.title}</h2>\n\n`
            + articleData.replace(/^(.|\n)+?---\n*/, '')
            + `\n<title>${postInfo.title}</title>\n`
        );
    }

    fs.writeFile(`${jsonSaveDir}/articleinfo.json`, JSON.stringify(postInfoArr));

    function readMeta(articleData, head, spliter = ' ', maxSearchLength = 700) {
        articleData = articleData.substr(0, maxSearchLength);
        let line = '';
        try {
            line = articleData.match(`\\n${head}:([^\\n]*)`)[1].trim(); // Whole line
        } catch {
            console.warn(`Can not find meta [${head}]`);
        }
        let valueArr = line.split(spliter);
        return valueArr;
    }

    // ==============================

    fs.recurse(devDir, ['src/**/*.html', '*.html'], (filepath, relative, filename) => {
        if (!filename) return; // Is folder
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode)
            ? fileDataStr
            : fileDataStr.replace(/<!--(.|\n)*?-->|(?<=>)(\s|\n)+/g, '') // Inline css or js will not be compressed
        );
    });

    fs.recurse(devDir, ['src/**/*.css'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode || filename.indexOf('.min.') != -1)
            ? fileDataStr
            : (new cleancss({
                level: { 2: { all: true } }
            })).minify(fileDataStr).styles
        );
    });

    fs.recurse(devDir, ['src/**/*.js'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileDataStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode || filename.indexOf('.min.') != -1)
            ? fileDataStr
            : terser.minify(fileDataStr, {
                compress: { unsafe: true, toplevel: true },
                mangle: { toplevel: true }
            }).code
        );
    });

    fs.recurse(devDir, ['*.ico', '*.txt', '*.svg', '*.json', 'toy/**/*.*'], (filepath, relative, filename) => {
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

console.time('Build');
buildBlog();
process.on('exit', () => console.timeEnd('Build'));
