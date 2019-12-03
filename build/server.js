/*!
 * Lightweight static server
 *
 * License: Unlicense
 */
'use strict'

const fs = require('fs')
const http = require('http')
const readline = require('readline')

const config = {
  ip: '127.0.0.1',
  port: 8080,
  rootDir: `${__dirname}/../dist`
}

const mimeList = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  md: 'text/markdown',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp'
}

const server = http.createServer((req, res) => {
  // Visit a dir or file with extension?
  if (req.url.search(/\/$/) === -1 && req.url.indexOf('.') === -1) {
    // Neither? Jump to url + "/"
    res.writeHead(302, { Location: req.url + '/' })
    res.end()
    return
  }
  const absolutePath = config.rootDir + req.url.replace(/\/$/, '')
  fs.stat(absolutePath, (e, stats) => {
    if (!e && stats.isFile()) {
      // Is file
      const extArr = absolutePath.split('.')
      const extension = extArr[extArr.length - 1]
      const contentType = mimeList[extension] || ''
      res.writeHead(200, { 'Content-Type': contentType })
      fs.createReadStream(absolutePath).pipe(res)
    } else if (!e && fs.existsSync(absolutePath + '/index.html')) {
      // Is folder
      res.writeHead(200, { 'Content-Type': mimeList.html })
      fs.createReadStream(absolutePath + '/index.html').pipe(res)
    } else {
      // Error
      res.writeHead(404, { 'Content-Type': mimeList.html })
      fs.createReadStream(config.rootDir + '/404.html').pipe(res)
    }
  })
})

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    server.close()
    config.port++
    server.listen(config.port, config.ip)
  } else {
    console.error('Server error: ', e)
  }
})

server.on('listening', () => {
  console.info(`Server is running on: ${config.ip}:${config.port}`)
})

server.listen(config.port, config.ip)

const readlineInterface = readline.createInterface({ input: process.stdin, output: process.stdout })
readlineInterface.question('', () => {
  readlineInterface.close()
  process.exit()
})
