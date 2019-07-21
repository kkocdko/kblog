/*!
 * Blog builder
 *
 * Matter: No CRLF support
 */
'use strict'

const fs = require('file-system') // This is not native fs
const terser = require('terser')
const Cleancss = require('clean-css')

function buildBlog (
  projectDir = `${__dirname}/..`,
  developMode = false
) {
  const imageSrcDir = `${projectDir}/_img`
  const articleSrcDir = `${projectDir}/_post`
  const pageSrcDir = `${projectDir}/_page`

  const devDir = `${projectDir}/dev`
  const distDir = `${projectDir}/dist`

  const imageSaveDir = `${distDir}/src/img`
  const articleSaveDir = `${distDir}/src/article`
  const pageSaveDir = `${distDir}/src/page`
  const jsonSaveDir = `${distDir}/src/json`

  // ==============================

  try {
    fs.rmdirSync(distDir)
  } catch (e) {}

  // ==============================

  const postInfoArr = []
  const articleFileArr = fs.readdirSync(articleSrcDir)
  for (const articleFile of articleFileArr) {
    const articleStr = fs.readFileSync(`${articleSrcDir}/${articleFile}`).toString()
    const dateMetaArr = readMeta(articleStr, 'date')
    const postInfo = {
      id: dateMetaArr[0].replace(/-/g, '') + dateMetaArr[1].replace(/:/g, ''),
      title: readMeta(articleStr, 'title')[0],
      date: dateMetaArr[0],
      time: dateMetaArr[1],
      category: readMeta(articleStr, 'category')[0],
      tagArr: readMeta(articleStr, 'tags'),
      excerpt: readMeta(articleStr, 'excerpt', '\n')[0]
    }
    postInfoArr.push(postInfo)

    // Write compact markdown file
    fs.writeFile(`${articleSaveDir}/${postInfo.id}.md`,
      `<h2 class=lite>${postInfo.title}</h2>\n\n` +
            articleStr.replace(/^(.|\n)+?---\n*/, '') +
            `\n<title>${postInfo.title}</title>\n`
    )
  }

  fs.writeFile(`${jsonSaveDir}/articleinfo.json`, JSON.stringify(postInfoArr))

  function readMeta (articleStr, head, spliter = ' ', maxSearchLength = 700) {
    articleStr = articleStr.substr(0, maxSearchLength)
    let line = ''
    try {
      line = articleStr.match(`\\n${head}:([^\\n]*)`)[1].trim() // Whole line
    } catch (e) {
      console.warn(`Can not find meta [${head}]`)
    }
    const valueArr = line.split(spliter)
    return valueArr
  }

  // ==============================

  fs.recurse(devDir, ['src/**/*.html', '*.html'], (filepath, relative, filename) => {
    if (!filename) return // Is folder
    const fileStr = fs.readFileSync(filepath).toString()
    fs.writeFile(`${distDir}/${relative}`,
      (developMode)
        ? fileStr
        : fileStr.replace(/<!--(.|\n)*?-->|(?<=>)(\s|\n)+/g, '') // Inline css and js will not be compressed
    )
  })

  fs.recurse(devDir, ['src/**/*.css'], (filepath, relative, filename) => {
    if (!filename) return
    const fileStr = fs.readFileSync(filepath).toString()
    fs.writeFile(`${distDir}/${relative}`,
      (developMode || filename.indexOf('.min.') !== -1)
        ? fileStr
        : (new Cleancss({
          level: {
            1: { specialComments: 'none' },
            2: { all: true }
          }
        })).minify(fileStr).styles
    )
  })

  fs.recurse(devDir, ['src/**/*.js'], (filepath, relative, filename) => {
    if (!filename) return
    const fileStr = fs.readFileSync(filepath).toString()
    fs.writeFile(`${distDir}/${relative}`,
      (developMode || filename.indexOf('.min.') !== -1)
        ? fileStr
        : terser.minify(fileStr, {
          compress: { unsafe: true, toplevel: true },
          mangle: { toplevel: true }
        }).code
    )
  })

  fs.recurse(devDir, ['*.ico', '*.txt', '*.svg', '*.json', 'toy/**/*.*'], (filepath, relative, filename) => {
    if (!filename) return
    fs.copyFile(filepath, `${distDir}/${relative}`)
  })

  fs.recurse(pageSrcDir, ['*.*'], (filepath, relative, filename) => {
    if (!filename) return
    fs.copyFile(filepath, `${pageSaveDir}/${relative}`)
  })

  fs.recurse(imageSrcDir, ['*.*'], (filepath, relative, filename) => {
    if (!filename) return
    fs.copyFile(filepath, `${imageSaveDir}/${relative}`)
  })
}

console.time('Build')
buildBlog()
process.on('exit', () => console.timeEnd('Build'))
