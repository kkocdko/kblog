/*!
 * Lightweight static server
 * 
 * Version: 20190309
 * 
 * Author: kkocdko
 * 
 * License: no license
 */
'use strict';

const fs = require('fs');
const http = require('http');

const mimeList = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'md': 'text/markdown',
    'ico': 'image/x-icon',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
};

const ip = '127.0.0.1';
const port = 8080;
const rootDir = __dirname + '/../dist';

http.createServer((req, res) => {
    let absolutePath = rootDir + req.url;
    fs.stat(absolutePath, (e, stats) => {
        if (!e && stats.isFile()) {
            let extArr = req.url.replace(/\/$/, '').split('.');
            let extension = extArr[extArr.length - 1];
            let contentType = mimeList[extension];
            if (!contentType) {
                contentType = ''
                console.warn('Unknown extension: ' + extension);
            };
            res.writeHead(200, {
                'Content-Type': contentType
            });
            fs.createReadStream(absolutePath).pipe(res);
            // res.end();
        } else {
            res.writeHead(404, {
                'Content-Type': mimeList['html']
            });
            fs.createReadStream(rootDir + '/404.html').pipe(res);
            // res.end();
        }
    });
}).listen(port, ip);

console.log(`Server is running on [${ip}:${port}]`);
