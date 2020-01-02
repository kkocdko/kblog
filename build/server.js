/*!
 * Github-Pages-Like server
 *
 * A simple static server that imitate the work of Github Pages's server
 *
 * License: Unlicense
 */
'use strict'

const config = {
  ip: '127.0.0.1',
  port: 8080,
  rootDir: `${__dirname}/../dist`
}

const fs = require('fs')
const http = require('http')
const readline = require('readline')

const mimeList = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  md: 'text/markdown',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  png: 'image/png',
  webp: 'image/webp'
}

const server = http.createServer((req, res) => {
  const url = new URL('http://' + req.headers.host + req.url)
  const filePath = config.rootDir + url.pathname.replace(/\/$/, '')
  fs.stat(filePath, (e, stats) => {
    if (!e && stats.isFile()) {
      // Is file
      const extension = filePath.match(/[^.]+$/)[0]
      const contentType = mimeList[extension] || ''
      res.writeHead(200, { 'Content-Type': contentType })
      fs.createReadStream(filePath).pipe(res)
    } else if (!e && fs.existsSync(filePath + '/index.html')) {
      // Is folder
      if (url.pathname.endsWith('/')) {
        res.writeHead(200, { 'Content-Type': mimeList.html })
        fs.createReadStream(filePath + '/index.html').pipe(res)
      } else {
        // Url is not ended with "/"
        url.pathname += '/'
        res.writeHead(302, { Location: url.href })
        res.end()
      }
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
    config.port++ // Try next port
    server.listen(config.port, config.ip)
  } else {
    throw e
  }
})

server.on('listening', () => {
  console.info(`Server address: ${config.ip}:${config.port}`)
})

server.listen(config.port, config.ip)

const readlineInterface = readline.createInterface({ input: process.stdin, output: process.stdout })
readlineInterface.question('', () => {
  readlineInterface.close()
  server.close()
  process.exit()
})
