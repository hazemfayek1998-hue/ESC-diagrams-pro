@echo off
echo Stopping ESC Study App...
taskkill /f /im node.exe >nul 2>&1
echo Done.
timeout /t 2 /nobreak >nul
