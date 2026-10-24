@echo off
cd /d "%~dp0..\vyapar-app"
set PORT=3001
set HOST=0.0.0.0
node server.mjs > server.log 2>&1
