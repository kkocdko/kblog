'use strict'

const fs = require('file-system') // This is not native fs
const path = require('path')
const Terser = require('terser')
const Cleancss = require('clean-css')

const config = require(path.join(__dirname, 'builder.config.js'))

try { fs.rmdirSync(config.dir.public.root) } catch {}
console.time('Build time')
process.on('exit', () => console.timeEnd('Build time'))

// ==============================

function shouldNotCompress (fileName) {
  return config.developMode || fileName.includes('.min.')
}

function readFileStr (filePath) {
  return fs.readFileSync(filePath).toString()
}

function processDir ({
  source,
  target,
  filter = ['*'],
  skimCondition = fileName => true,
  processor = fileStr => null
}) {
  fs.recurse(source, filter, (absolute, relative, name) => {
    if (!name) return // It's a folder, not a file
    const targetPath = path.join(target, relative)
    if (skimCondition(name)) {
      fs.copyFile(absolute, targetPath)
    } else {
      fs.writeFile(targetPath, processor(readFileStr(absolute)))
    }
  })
}

// ==============================

processDir({
  source: config.dir.source.pages,
  target: config.dir.public.pages
})

processDir({
  source: config.dir.source.media,
  target: config.dir.public.media
})

processDir({
  source: config.dir.swatch.root,
  target: config.dir.public.root,
  filter: ['**/*', '!*.html', '!robots.txt', '!res/**/*']
})

processDir({
  source: config.dir.swatch.root,
  target: config.dir.public.root,
  filter: ['res/**/*.html', '*.html'],
  skimCondition: shouldNotCompress,
  processor: str => str.replace(/<!--(.|\n)*?-->|(?<=>)\s+|\s+(?=<)/g, '') // Inline css and js will not be compressed
})

processDir({
  source: config.dir.swatch.root,
  target: config.dir.public.root,
  filter: ['res/**/*.css'],
  skimCondition: shouldNotCompress,
  processor: str => new Cleancss(config.compressor.cleancss).minify(str).styles
})

processDir({
  source: config.dir.swatch.root,
  target: config.dir.public.root,
  filter: ['res/**/*.js'],
  skimCondition: shouldNotCompress,
  processor: str => {
    const transformer = new Terser.TreeTransformer(node => {
      if (node instanceof Terser.AST_Const) {
        return new Terser.AST_Let(node)
      }
    })
    const ast = Terser.parse(str).transform(transformer)
    return Terser.minify(ast, config.compressor.terser).code.replace(/;$/, '')
  }
})

// ==============================

const postsList = fs.readdirSync(config.dir.source.posts).map(fileName => {
  const fileStr = readFileStr(path.join(config.dir.source.posts, fileName))
  const rawInfo = {}
  const infoBlockStartIndex = '```\n'.length // No CRLF support !!!
  const infoBlockLength = fileStr.indexOf('\n```') - infoBlockStartIndex
  const infoBlockStr = fileStr.substr(infoBlockStartIndex, infoBlockLength)
  const infoBlockLines = infoBlockStr.split('\n')
  infoBlockLines.forEach(line => {
    const infoSplitIndex = line.indexOf(':')
    const infoName = line.substr(0, infoSplitIndex)
    const infoList = line.substr(infoSplitIndex + 1).trim().split(' ')
    rawInfo[infoName] = infoList
  })
  const info = {
    id: rawInfo.date.join('').replace(/:|-/g, ''),
    title: rawInfo.title.join(' '),
    date: rawInfo.date[0],
    time: rawInfo.date[1],
    category: rawInfo.category[0],
    tags: rawInfo.tags,
    description: rawInfo.description.join(' ')
  }
  // Write compact markdown file
  fs.writeFile(
    path.join(config.dir.public.posts, info.id + '.md'),
      `<h2 class="lite">${info.title}</h2>\n\n` +
      fileStr.substr(2 * infoBlockStartIndex + infoBlockLength).trim() +
      `\n\n<title>${info.title}</title>\n`
  )
  return info
}).sort(({ id: firstId }, { id: secondId }) => firstId > secondId ? -1 : 1)
fs.writeFile(path.join(config.dir.public.res, 'postslist.json'), JSON.stringify(postsList))

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
postsList.forEach(({ id }) => siteMapAddItem(`/post/${id}`))
siteMapStr += '</urlset>'
fs.writeFile(path.join(config.dir.public.root, 'sitemap.xml'), siteMapStr)

// ==============================

fs.writeFile(`${config.dir.public.root}/robots.txt`,
  `Sitemap: ${config.site.domain}/sitemap.xml\n` +
  readFileStr(path.join(config.dir.swatch.root, 'robots.txt')).trim() + '\n'
)
