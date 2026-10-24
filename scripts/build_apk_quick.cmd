cd /d "%~dp0..\android"
call gradlew.bat assembleRelease --no-daemon > ..\build_gradle.log 2>&1
