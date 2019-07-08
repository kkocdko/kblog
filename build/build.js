/*!
 * Blog builder
 * 
 * Matter: No CRLF support
 */
'use strict';

let fs = require('file-system'); // This is not native fs
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
        let articleStr = fs.readFileSync(`${articleSrcDir}/${articleFile}`).toString();
        let dateMetaArr = readMeta(articleStr, 'date');
        let postInfo = {
            id: dateMetaArr[0].replace(/\-/g, '') + dateMetaArr[1].replace(/\:/g, ''),
            title: readMeta(articleStr, 'title')[0],
            date: dateMetaArr[0],
            time: dateMetaArr[1],
            category: readMeta(articleStr, 'category')[0],
            tagArr: readMeta(articleStr, 'tags'),
            excerpt: readMeta(articleStr, 'excerpt', '\n')[0],
        };
        postInfoArr.push(postInfo);

        // Write compact markdown file
        fs.writeFile(`${articleSaveDir}/${postInfo.id}.md`,
            `<h2 class=lite>${postInfo.title}</h2>\n\n`
            + articleStr.replace(/^(.|\n)+?---\n*/, '')
            + `\n<title>${postInfo.title}</title>\n`
        );
    }

    fs.writeFile(`${jsonSaveDir}/articleinfo.json`, JSON.stringify(postInfoArr));

    function readMeta(articleStr, head, spliter = ' ', maxSearchLength = 700) {
        articleStr = articleStr.substr(0, maxSearchLength);
        let line = '';
        try {
            line = articleStr.match(`\\n${head}:([^\\n]*)`)[1].trim(); // Whole line
        } catch {
            console.warn(`Can not find meta [${head}]`);
        }
        let valueArr = line.split(spliter);
        return valueArr;
    }

    // ==============================

    fs.recurse(devDir, ['src/**/*.html', '*.html'], (filepath, relative, filename) => {
        if (!filename) return; // Is folder
        let fileStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode)
            ? fileStr
            : fileStr.replace(/<!--(.|\n)*?-->|(?<=>)(\s|\n)+/g, '') // Inline css and js will not be compressed
        );
    });

    fs.recurse(devDir, ['src/**/*.css'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode || filename.indexOf('.min.') != -1)
            ? fileStr
            : (new cleancss({
                level: {
                    1: { specialComments: 'none' },
                    2: { all: true }
                }
            })).minify(fileStr).styles
        );
    });

    fs.recurse(devDir, ['src/**/*.js'], (filepath, relative, filename) => {
        if (!filename) return;
        let fileStr = fs.readFileSync(filepath).toString();
        fs.writeFile(`${distDir}/${relative}`,
            (developMode || filename.indexOf('.min.') != -1)
            ? fileStr
            : terser.minify(fileStr, {
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
