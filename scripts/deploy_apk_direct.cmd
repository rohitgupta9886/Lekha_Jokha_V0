cd /d "%~dp0.."
copy /y "android\app\build\outputs\apk\release\app-release.apk" "dist\LekhaJokha-Android-v2.0.0.apk" > deploy.log 2>&1
set ADB="C:\Users\Priyanka Gupta\AppData\Local\Android\Sdk\platform-tools\adb.exe"
%ADB% devices >> deploy.log 2>&1
%ADB% reverse tcp:3000 tcp:3000 >> deploy.log 2>&1
%ADB% install -r -d "dist\LekhaJokha-Android-v2.0.0.apk" >> deploy.log 2>&1
%ADB% shell am force-stop in.lekhajokha.app >> deploy.log 2>&1
%ADB% shell am start -n in.lekhajokha.app/.MainActivity >> deploy.log 2>&1
%ADB% shell pidof in.lekhajokha.app >> deploy.log 2>&1
echo DEPLOY_COMPLETED >> deploy.log 2>&1
