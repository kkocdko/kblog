'use strict'

const fs = require('file-system') // This is not native fs
const path = require('path')
const htmlMinifier = require('html-minifier-terser')
const Cleancss = require('clean-css')
const terser = require('terser')
const marked = require('marked')

const config = require(path.join(__dirname, 'builder.config.js'))

try { fs.rmdirSync(config.dir.public.root) } catch {}
console.time('Build time')
process.on('exit', () => console.timeEnd('Build time'))

const readFileStr = filePath => fs.readFileSync(filePath).toString()

fs.recurse(config.dir.source.media, ['*'], (absolute, relative, filename) => {
  if (!filename) return // It's a folder, not a file
  fs.copyFile(absolute, path.join(config.dir.public.media, relative))
})

fs.recurse(config.dir.swatch.root, ['**/*', '!*.html', '!robots.txt', '!res/**/*'], (absolute, relative, filename) => {
  if (!filename) return
  fs.copyFile(absolute, path.join(config.dir.public.root, relative))
})

fs.recurse(config.dir.swatch.res, ['*.css'], (absolute, relative) => {
  const targetPath = path.join(config.dir.public.res, relative)
  if (config.developMode) {
    fs.copyFile(absolute, targetPath)
  } else {
    fs.writeFile(targetPath, new Cleancss(config.compressor.cleanCss).minify(readFileStr(absolute)).styles)
  }
})

fs.recurse(config.dir.swatch.res, ['*.js'], (absolute, relative) => {
  const targetPath = path.join(config.dir.public.res, relative)
  if (config.developMode) {
    fs.copyFile(absolute, targetPath)
  } else {
    // This method will cause omitting! Why?
    // const transformer = new terser.TreeTransformer(node => {
    //   if (node instanceof terser.AST_Const) {
    //     return new terser.AST_Let(node)
    //   }
    // })
    // const ast = terser.parse(readFileStr(absolute)).transform(transformer)
    // fs.writeFile(targetPath, terser.minify(ast, config.compressor.terser).code.replace(/;$/, ''))
    const transformed = readFileStr(absolute).replace(/const\s/g, 'let ')
    fs.writeFile(targetPath, terser.minify(transformed, config.compressor.terser).code.replace(/;$/, ''))
  }
})

const parseMdFile = filePath => {
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
  const contentHtmlStr = marked(`# ${metaData.get('title')}\n\n${contentMdStr}\n`)
  return {
    meta: metaData,
    content: config.developMode
      ? contentHtmlStr
      : htmlMinifier.minify(contentHtmlStr, {
        ...config.compressor.htmlMinifier,
        ...config.compressor.htmlMinifierMd
      })
  }
}

const generatePage = (() => {
  const replacePattern = (sourceStr, replaceList) => {
    replaceList.forEach(({ key, value }) => {
      const regexp = new RegExp('{{ ' + key + ' }}', 'g') // Pay attention to the spaces
      sourceStr = sourceStr.replace(regexp, value)
    })
    return sourceStr
  }
  let templateStr = readFileStr(path.join(config.dir.swatch.root, 'main.html'))
  templateStr = replacePattern(templateStr, [
    { key: 'title-default', value: config.site.defaultTitle },
    { key: 'user-name', value: config.site.userName }
  ])
  if (!config.developMode) templateStr = htmlMinifier.minify(templateStr, config.compressor.htmlMinifier)
  return ({ title = '', description = '', content = '' }) => replacePattern(templateStr, [
    { key: 'title', value: title + ' - ' + config.site.defaultTitle },
    { key: 'description', value: description },
    { key: 'main-content', value: content }
  ])
})()

fs.writeFile(path.join(config.dir.public.root, '404.html'), generatePage({ title: 'Loading' }))

const pagesList = []
fs.recurseSync(config.dir.source.pages, ['*'], absolute => {
  const { meta, content } = parseMdFile(absolute)
  const pageInfo = {
    name: path.parse(absolute).name,
    path: meta.get('path'),
    title: meta.get('title'),
    description: meta.get('description')
  }
  fs.writeFile(path.join(config.dir.public.pages, pageInfo.name + '.md.html'), content)
  fs.writeFile(
    path.join(config.dir.public.root, pageInfo.path || pageInfo.name, 'index.html'),
    generatePage({
      title: pageInfo.title,
      description: pageInfo.description,
      content: `<article class="markdown-body">${content}</article>`
    })
  )
  pagesList.push(pageInfo)
})

const postsList = []
fs.recurseSync(config.dir.source.posts, ['*'], absolute => {
  const { meta, content } = parseMdFile(absolute)
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
      description: postInfo.description,
      content: `<article class="markdown-body">${content}</article>`
    })
  )
  postsList.push(postInfo)
})
postsList.sort((post1, post2) => post1.id > post2.id ? -1 : 1)

fs.writeFile(path.join(config.dir.public.res, 'postslist.json'), JSON.stringify(postsList))

let siteMapStr =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
const siteMapAddItem = relative => {
  siteMapStr += `<url><loc>${config.site.domain}${relative}</loc><changefreq>daily</changefreq></url>`
}
pagesList.forEach(({ name, path }) => siteMapAddItem(path || `/${name}/`))
postsList.forEach(({ id }) => siteMapAddItem(`/post/${id}/`))
siteMapStr += '</urlset>'
fs.writeFile(path.join(config.dir.public.root, 'sitemap.xml'), siteMapStr)

fs.writeFile(`${config.dir.public.root}/robots.txt`,
  `Sitemap: ${config.site.domain}/sitemap.xml\n` +
  readFileStr(path.join(config.dir.swatch.root, 'robots.txt')).trim() + '\n'
)
