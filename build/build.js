'use strict'

const fs = require('file-system') // This is not native fs
const Terser = require('terser')
const Cleancss = require('clean-css')

const config = require(`${__dirname}/config.js`)

try { fs.rmdirSync(config.directories.dist.root) } catch {}
console.time('Build time')
process.on('exit', () => console.timeEnd('Build time'))

// ==============================

const articlesList = fs.readdirSync(config.directories.source.article).map(articleFile => {
  const articleStr = readFileStr(`${config.directories.source.article}/${articleFile}`)
  const articleRawInfo = {}
  const infoBlockStartIndex = '---\n'.length // No CRLF support !!!
  const infoBlockLength = articleStr.indexOf('\n---') - infoBlockStartIndex
  const infoBlockStr = articleStr.substr(infoBlockStartIndex, infoBlockLength)
  const infoBlockLines = infoBlockStr.split('\n')
  infoBlockLines.forEach(line => {
    const infoSplitIndex = line.indexOf(':')
    const infoName = line.substr(0, infoSplitIndex)
    const infoList = line.substr(infoSplitIndex + 1).trim().split(' ')
    articleRawInfo[infoName] = infoList
  })
  const articleInfo = {
    id: articleRawInfo.date.join('').replace(/:|-/g, ''),
    title: articleRawInfo.title.join(' '),
    date: articleRawInfo.date[0],
    time: articleRawInfo.date[1],
    category: articleRawInfo.category[0],
    tagsList: articleRawInfo.tags,
    excerpt: articleRawInfo.excerpt.join(' ')
  }
  // Write compact markdown file
  fs.writeFile(`${config.directories.dist.article}/${articleInfo.id}.md`,
    `<h2 class="lite">${articleInfo.title}</h2>\n\n` +
    articleStr.substr(2 * infoBlockStartIndex + infoBlockLength).trim() +
    `\n\n<title>${articleInfo.title}</title>\n`
  )
  return articleInfo
}).sort(({ id: firstId }, { id: secondId }) => firstId > secondId ? -1 : 1)
fs.writeFile(`${config.directories.dist.json}/articleslist.json`, JSON.stringify(articlesList))

// ==============================

let siteMapStr =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
const siteMapAddItem = (relative, others = '') => {
  siteMapStr +=
  '<url>' +
  `<loc>${config.site.domain}/404.html?path=${relative}</loc>` +
  '<changefreq>daily</changefreq>' +
  others +
  '</url>'
}
siteMapAddItem('/home/1')
articlesList.forEach(({ id }) => siteMapAddItem(`/article/${id}`))
siteMapStr += '</urlset>'
fs.writeFile(`${config.directories.dist.root}/sitemap.xml`, siteMapStr)

// ==============================

fs.writeFile(`${config.directories.dist.root}/robots.txt`,
  `Sitemap: ${config.site.domain}/sitemap.xml\n` +
  readFileStr(`${config.directories.source.develop}/robots.txt`).trim() + '\n'
)

// ==============================

fs.recurse(config.directories.source.develop, ['src/**/*.html', '*.html'], (path, relative, name) => {
  if (!name) return // It's a folder, not a file
  if (shouldCompress(name)) {
    fs.writeFile(`${config.directories.dist.root}/${relative}`,
      readFileStr(path).replace(/<!--(.|\n)*?-->|(?<=>)\s+|\s+(?=<)/g, '') // Inline css and js will not be compressed
    )
  } else {
    fs.copyFile(path, `${config.directories.dist.root}/${relative}`)
  }
})

fs.recurse(config.directories.source.develop, ['src/**/*.css'], (path, relative, name) => {
  if (!name) return
  if (shouldCompress(name)) {
    fs.writeFile(`${config.directories.dist.root}/${relative}`,
      new Cleancss(config.compressor.cleancss).minify(readFileStr(path)).styles
    )
  } else {
    fs.copyFile(path, `${config.directories.dist.root}/${relative}`)
  }
})

fs.recurse(config.directories.source.develop, ['src/**/*.js'], (path, relative, name) => {
  if (!name) return
  if (shouldCompress(name)) {
    const transformer = new Terser.TreeTransformer(node => {
      if (node instanceof Terser.AST_Const) {
        return new Terser.AST_Let(node)
      }
    })
    const ast = Terser.parse(readFileStr(path)).transform(transformer)
    const minifiedJsStr = Terser.minify(ast, config.compressor.terser).code.replace(/;$/, '')
    fs.writeFile(`${config.directories.dist.root}/${relative}`, minifiedJsStr)
  } else {
    fs.copyFile(path, `${config.directories.dist.root}/${relative}`)
  }
})

fs.recurse(config.directories.source.develop, ['**/*', '!*.html', '!robots.txt', '!src/**/*'], (path, relative, name) => {
  if (!name) return
  fs.copyFile(path, `${config.directories.dist.root}/${relative}`)
})

fs.recurse(config.directories.source.page, ['*'], (path, relative, name) => {
  if (!name) return
  fs.copyFile(path, `${config.directories.dist.page}/${relative}`)
})

fs.recurse(config.directories.source.image, ['*'], (path, relative, name) => {
  if (!name) return
  fs.copyFile(path, `${config.directories.dist.image}/${relative}`)
})

// ==============================

function shouldCompress (filename) {
  return !config.developMode && !filename.includes('.min.')
}

function readFileStr (filePath) {
  return fs.readFileSync(filePath).toString()
}
