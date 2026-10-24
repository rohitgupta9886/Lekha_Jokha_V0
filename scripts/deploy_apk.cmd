@echo off
cd /d "%~dp0\.."
node scripts\install_and_test_apk.mjs > deploy.log 2>&1
