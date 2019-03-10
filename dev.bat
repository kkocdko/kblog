@echo off
cd /d %~dp0
node build/index.js
node build/server.js
