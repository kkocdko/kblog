'use strict'

const fs = require('file-system') // This is not native fs
const path = require('path')
const Cleancss = require('clean-css')
const Terser = require('terser')
const marked = require('marked')

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

function compressHtml (htmlStr) {
  return htmlStr.replace(/<!--(.|\n)*?-->|(?<=>)\s+|\s+(?=<)/g, '') // Inline css and js will not be compressed
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

function parseMdFile (filePath) {
  const fileStr = readFileStr(filePath)
  const metaData = new Map()
  const metaStrBracket = '```'
  const metaStrStartIndex = metaStrBracket.length
  const metaStrEndIndex = fileStr.indexOf('\n' + metaStrBracket) // No CRLF support !!!
  const metaStr = fileStr.slice(metaStrStartIndex, metaStrEndIndex).trim()
  const metaStrLines = metaStr.split('\n')
  metaStrLines.forEach(line => {
    const splitIndex = line.indexOf(':')
    const key = line.substr(0, splitIndex)
    const value = line.substr(splitIndex + 1).trim()
    metaData.set(key, value)
  })
  const contentMdStr = fileStr.substr(metaStrEndIndex + metaStrBracket.length + 1).trim()
  const contentHtmlStr = marked(`# ${metaData.get('title')}\n\n${contentMdStr}\n\n<title>${metaData.get('title')}</title>\n`)
  return { meta: metaData, content: compressHtml(contentHtmlStr) }
}

const generatePage = (() => {
  const templateSrcStr = readFileStr(path.join(config.dir.swatch.root, 'index.html'))
  const templateStr = compressHtml(templateSrcStr)
  return ({
    defaultTitle = config.site.title,
    title = config.site.title,
    userName = config.site.name,
    description = '',
    content = ''
  }) => {
    let result = templateStr
    function replaceItem (key, value) {
      const regexp = new RegExp('{{' + key + '}}', 'g')
      result = result.replace(regexp, value)
    }
    replaceItem('title-default', defaultTitle)
    replaceItem('title', title)
    replaceItem('user-name', userName)
    replaceItem('description', description)
    replaceItem('main-content', content)
    return result
  }
})()

// ==============================

fs.writeFile(path.join(config.dir.public.root, '404.html'), generatePage({}))

fs.writeFile(
  path.join(config.dir.public.root, 'index.html'),
  generatePage({
    description: 'This is kkocdko\'s blog, welcome!',
    content: '<article class="markdown-body" style="text-align:center"><h1>Welcome to my blog!</h1><p>Please wait ...</p><style onload="if(!this.initialized){this.initialized=true;setTimeout(()=>document.querySelector(\'header .avatar\').click(),1000)}"></style></article>'
  })
)

const pagesList = []
fs.readdirSync(config.dir.source.pages).forEach(fileName => {
  const { meta, content } = parseMdFile(path.join(config.dir.source.pages, fileName))
  const pageName = path.parse(fileName).name
  fs.writeFile(path.join(config.dir.public.pages, fileName + '.html'), content)
  fs.writeFile(
    path.join(config.dir.public.root, pageName, 'index.html'),
    generatePage({
      title: meta.get('title'),
      description: meta.get('description'),
      content: `<article class="markdown-body">${content}</article>`
    })
  )
  pagesList.push({ pageName })
})

// ==============================

const postsList = []
fs.readdirSync(config.dir.source.posts).forEach(fileName => {
  const { meta, content } = parseMdFile(path.join(config.dir.source.posts, fileName))
  const postInfo = {
    id: meta.get('date').replace(/:|-|\s/g, ''),
    title: meta.get('title'),
    date: meta.get('date').split(' ')[0],
    time: meta.get('date').split(' ')[1],
    category: meta.get('category'),
    tags: meta.get('tags').split(' '),
    description: meta.get('description')
  }
  fs.writeFile(path.join(config.dir.public.posts, postInfo.id + '.md.html'), content)
  fs.writeFile(
    path.join(config.dir.public.root, 'post', postInfo.id, 'index.html'),
    generatePage({
      title: postInfo.title,
      description: postsList.description,
      content: `<article class="markdown-body">${content}</article>`
    })
  )
  postsList.push(postInfo)
})
postsList.sort(({ id: firstId }, { id: secondId }) => firstId > secondId ? -1 : 1)
fs.writeFile(path.join(config.dir.public.res, 'postslist.json'), JSON.stringify(postsList))

// ==============================

let siteMapStr =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
const siteMapAddItem = (relative, others = '') => {
  siteMapStr +=
  '<url>' +
  `<loc>${config.site.domain}${relative}</loc>` +
  '<changefreq>daily</changefreq>' +
  others +
  '</url>'
}
siteMapAddItem('/')
pagesList.forEach(({ pageName }) => siteMapAddItem(`/${pageName}/`))
postsList.forEach(({ id }) => siteMapAddItem(`/post/${id}/`))
siteMapStr += '</urlset>'
fs.writeFile(path.join(config.dir.public.root, 'sitemap.xml'), siteMapStr)

// ==============================

fs.writeFile(`${config.dir.public.root}/robots.txt`,
  `Sitemap: ${config.site.domain}/sitemap.xml\n` +
  readFileStr(path.join(config.dir.swatch.root, 'robots.txt')).trim() + '\n'
)
