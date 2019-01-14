'use strict';

const fs = require('fs');

fs.copydirSync = (srcDir, targetDir) => {
    if (fs.existsSync(targetDir)) {
        function rmdirForceSync(dir) {
            for (let path of fs.readdirSync(dir)) {
                let curPath = `${dir}/${path}`;
                if (fs.statSync(curPath).isFile()) {
                    fs.unlinkSync(curPath);
                } else {
                    rmdirForceSync(curPath);
                }
            }
            fs.rmdirSync(dir);
        }
        rmdirForceSync(targetDir);
        fs.mkdirSync(targetDir);
    } else {
        fs.mkdirSync(targetDir);
    }

    function copyCutDir(cutSrcDir, cutTargetDir) {
        let dirArr = fs.readdirSync(cutSrcDir);
        for (let dir of dirArr) {
            let src = `${cutSrcDir}/${dir}`;
            let target = `${cutTargetDir}/${dir}`;
            if (fs.statSync(src).isFile()) {
                fs.copyFileSync(src, target);
            } else {
                copyCutDir(src, target);
            }
        }
    }
    copyCutDir(srcDir, targetDir);
}


const projectDir = 'E:/Code/Repos/Web/Blog';

const articleSrcDir = `${projectDir}/_post`;

const devDir = `${projectDir}/dev`;
const distDir = `${projectDir}/dist`;

const articleSaveDir = `${distDir}/src/article`;



function buildBlog() {
    // ==============================
    fs.copydirSync(devDir, distDir);

    console.time('build');

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
        let dateValueArr = readMeta(articleData, 'date');
        let dateStr = dateValueArr[0].replace(/\-/g, '');
        let timeStr = dateValueArr[1].replace(/\:/g, '');
        let id = dateStr + timeStr;
        return id;
    }

    let articleFileArr = fs.readdirSync(articleSrcDir);

    let idArr = [];
    let titleArr = [];
    let dateStrArr = [];
    let timeStrArr = [];
    let categoryArr = [];
    let tagArrArr = [];
    let excerptArr = [];

    for (let mdFile of articleFileArr) {
        let articleData = fs.readFileSync(`${articleSrcDir}/${mdFile}`).toString();
        
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
            articleData.replace(/---(.|\n|\r)+?---/, '') +
            `\n<title>${articleTitle}</title>`
        );
    }

    console.timeEnd('build');

    // ==============================
}

buildBlog();
