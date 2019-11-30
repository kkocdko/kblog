'use strict'

const config = {
  developMode: process.argv.includes('--dev-mode'),
  projectDir: `${__dirname}/..`,
  minifyOptions: {
    cleancss: {
      level: {
        1: { specialComments: 'none' },
        2: { all: true }
      }
    },
    terser: {
      compress: {
        toplevel: true,
        arguments: true,
        booleans_as_integers: true,
        drop_console: true,
        hoist_funs: true,
        passes: 2,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_Function: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true
      },
      mangle: { toplevel: true }
    }
  }
}

// ==============================

const fs = require('file-system') // This is not native fs
const Terser = require('terser')
const Cleancss = require('clean-css')

// ==============================

console.time('Build time')
process.on('exit', () => console.timeEnd('Build time'))

// ==============================

const projectDir = config.projectDir

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
} catch {}

// ==============================

const postInfoArr = []
const articleFileArr = fs.readdirSync(articleSrcDir)
for (const articleFile of articleFileArr) {
  const articleStr = readFileStr(`${articleSrcDir}/${articleFile}`)
  const dateMetaArr = readMeta(articleStr, 'date')
  const postInfo = {
    id: dateMetaArr[0].replace(/-/g, '') + dateMetaArr[1].replace(/:/g, ''),
    title: readMeta(articleStr, 'title', '\n')[0], // No CRLF support !!!
    date: dateMetaArr[0],
    time: dateMetaArr[1],
    category: readMeta(articleStr, 'category')[0],
    tagArr: readMeta(articleStr, 'tags'),
    excerpt: readMeta(articleStr, 'excerpt', '\n')[0]
  }
  postInfoArr.push(postInfo)

  // Write compact markdown file
  fs.writeFile(`${articleSaveDir}/${postInfo.id}.md`,
      `<h2 class="lite">${postInfo.title}</h2>\n\n` +
      articleStr.replace(/^(.|\n)+?---/, '').trim() +
      `\n\n<title>${postInfo.title}</title>\n`
  )
}

fs.writeFile(`${jsonSaveDir}/articleinfo.json`, JSON.stringify(postInfoArr))

// ==============================

fs.recurse(devDir, ['src/**/*.html', '*.html'], (filepath, relative, filename) => {
  if (!filename) return // Is folder
  const fileStr = readFileStr(filepath)
  fs.writeFile(`${distDir}/${relative}`,
    config.developMode
      ? fileStr
      : fileStr.replace(/<!--(.|\n)*?-->|(?<=>)(\s|\n)+/g, '') // Inline css and js will not be compressed
  )
})

fs.recurse(devDir, ['src/**/*.css'], (filepath, relative, filename) => {
  if (!filename) return
  const cssStr = readFileStr(filepath)
  fs.writeFile(`${distDir}/${relative}`,
    config.developMode || /\.min\./.test(filename)
      ? cssStr
      : new Cleancss(config.minifyOptions.cleancss).minify(cssStr).styles
  )
})

fs.recurse(devDir, ['src/**/*.js'], (filepath, relative, filename) => {
  if (!filename) return
  const jsStr = readFileStr(filepath)
  fs.writeFile(`${distDir}/${relative}`,
    config.developMode || /\.min\./.test(filename)
      ? jsStr
      : (() => {
        const transformer = new Terser.TreeTransformer(node => {
          if (node instanceof Terser.AST_Const) {
            return new Terser.AST_Let(node)
          }
        })
        const ast = Terser.parse(jsStr).transform(transformer)
        const minifiedJsStr = Terser.minify(ast, config.minifyOptions.terser).code.replace(/;$/, '')
        return minifiedJsStr
      })()
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

// ==============================

function readMeta (articleStr, head, spliter = ' ', maxSearchLength = 400) {
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

function readFileStr (filePath) {
  return fs.readFileSync(filePath).toString()
}
