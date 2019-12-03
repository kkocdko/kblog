'use strict'

const buildConfig = {
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

const projectDir = buildConfig.projectDir

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

const articlesList = fs.readdirSync(articleSrcDir).map(articleFile => {
  const articleStr = readFileStr(`${articleSrcDir}/${articleFile}`)
  const dateMetaList = readMeta(articleStr, 'date')
  const articleInfo = {
    id: dateMetaList[0].replace(/-/g, '') + dateMetaList[1].replace(/:/g, ''),
    title: readMeta(articleStr, 'title', '\n')[0], // No CRLF support !!!
    date: dateMetaList[0],
    time: dateMetaList[1],
    category: readMeta(articleStr, 'category')[0],
    tagsList: readMeta(articleStr, 'tags'),
    excerpt: readMeta(articleStr, 'excerpt', '\n')[0]
  }
  // Write compact markdown file
  fs.writeFile(`${articleSaveDir}/${articleInfo.id}.md`,
      `<h2 class="lite">${articleInfo.title}</h2>\n\n` +
      articleStr.replace(/^(.|\n)+?---/, '').trim() +
      `\n\n<title>${articleInfo.title}</title>\n`
  )
  return articleInfo
}).sort(({ id: firstId }, { id: secondId }) => firstId > secondId ? -1 : 1)
fs.writeFile(`${jsonSaveDir}/articleslist.json`, JSON.stringify(articlesList))

// ==============================

fs.recurse(devDir, ['src/**/*.html', '*.html'], (path, relative, name) => {
  if (!name) return // It's a folder, not a file
  if (shouldCompress(name)) {
    fs.writeFile(`${distDir}/${relative}`,
      readFileStr(path).replace(/<!--(.|\n)*?-->|(?<=>)(\s|\n)+/g, '') // Inline css and js will not be compressed
    )
  } else {
    fs.copyFile(path, `${distDir}/${relative}`)
  }
})

fs.recurse(devDir, ['src/**/*.css'], (path, relative, name) => {
  if (!name) return
  if (shouldCompress(name)) {
    fs.writeFile(`${distDir}/${relative}`,
      new Cleancss(buildConfig.minifyOptions.cleancss).minify(readFileStr(path)).styles
    )
  } else {
    fs.copyFile(path, `${distDir}/${relative}`)
  }
})

fs.recurse(devDir, ['src/**/*.js'], (path, relative, name) => {
  if (!name) return
  if (shouldCompress(name)) {
    const transformer = new Terser.TreeTransformer(node => {
      if (node instanceof Terser.AST_Const) {
        return new Terser.AST_Let(node)
      }
    })
    const ast = Terser.parse(readFileStr(path)).transform(transformer)
    const minifiedJsStr = Terser.minify(ast, buildConfig.minifyOptions.terser).code.replace(/;$/, '')
    fs.writeFile(`${distDir}/${relative}`, minifiedJsStr)
  } else {
    fs.copyFile(path, `${distDir}/${relative}`)
  }
})

fs.recurse(devDir, ['*.ico', '*.txt', '*.svg', '*.json', 'toy/**/*.*'], (path, relative, name) => {
  if (!name) return
  fs.copyFile(path, `${distDir}/${relative}`)
})

fs.recurse(pageSrcDir, ['*.*'], (path, relative, name) => {
  if (!name) return
  fs.copyFile(path, `${pageSaveDir}/${relative}`)
})

fs.recurse(imageSrcDir, ['*.*'], (path, relative, name) => {
  if (!name) return
  fs.copyFile(path, `${imageSaveDir}/${relative}`)
})

// ==============================

function readMeta (articleStr, head, spliter = ' ', maxSearchLength = 400) {
  articleStr = articleStr.substr(0, maxSearchLength)
  let resultLine = ''
  try {
    resultLine = articleStr.match(`\\n${head}:([^\\n]*)`)[1].trim() // Whole line
  } catch (e) {
    console.warn(`Can not find meta [${head}]`)
  }
  const resultArr = resultLine.split(spliter)
  return resultArr
}

function shouldCompress (filename) {
  return !(buildConfig.developMode || /\.min\./.test(filename))
}

function readFileStr (filePath) {
  return fs.readFileSync(filePath).toString()
}
