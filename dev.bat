@echo off
cd /d %~dp0
if "%1" == "called" (
    title KBlog
    node build/build.js
    node build/server.js
) else (
    cmd /k %~nx0 called
)
