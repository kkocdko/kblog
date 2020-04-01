@echo off
cd /d %~dp0
:main
node generator.js --dev-mode
node server.js
goto main
