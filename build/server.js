/*!
 * Lightweight static server
 * 
 * Version: 20190318
 * 
 * Author: kkocdko
 * 
 * License: no license
 */
'use strict';

let fs = require('fs');
let http = require('http');

let mimeList = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'md': 'text/markdown',
    'ico': 'image/x-icon',
    'svg': 'image/svg+xml',
    'webp': 'image/webp'
};

let serverConfig = {
    ip: '127.0.0.1',
    port: 8080,
    rootDir: __dirname + '/../dist'
};

let server = http.createServer((req, res) => {
    // Visit a dir or file with extension.
    if (req.url.search(/\/$/) != -1 || req.url.indexOf('.') != -1) {
        let absolutePath = serverConfig.rootDir + req.url.replace(/\/$/, '');
        fs.stat(absolutePath, (e, stats) => {
            if (!e && stats.isFile()) {
                // Is file
                let extArr = absolutePath.split('.');
                let extension = extArr[extArr.length - 1];
                let contentType = mimeList[extension];
                if (!contentType) {
                    contentType = '';
                    console.warn('Unknown extension: ' + extension);
                };
                res.writeHead(200, { 'Content-Type': contentType });
                fs.createReadStream(absolutePath).pipe(res);
            } else if (!e && fs.existsSync(absolutePath + '/index.html')) {
                // Is folder
                res.writeHead(200, { 'Content-Type': mimeList['html'] });
                fs.createReadStream(absolutePath + '/index.html').pipe(res);
            } else {
                // Error
                res.writeHead(404, { 'Content-Type': mimeList['html'] });
                fs.createReadStream(serverConfig.rootDir + '/404.html').pipe(res);
            }
        });
    } else {
        // Jump to url + "/"
        res.writeHead(302, { 'Location': req.url + '/' });
        res.end();
    }
});

server.listen(serverConfig.port, serverConfig.ip);

console.info(`Server is running on [${serverConfig.ip}:${serverConfig.port}]`);
