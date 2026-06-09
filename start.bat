@echo off
title ESC Study App
echo Starting ESC Study App...
echo.

:: Go to the folder where this file lives
cd /d "%~dp0"

:: Open browser after 4 seconds (runs in background)
start "" timeout /t 4 /nobreak >nul && start "" "http://localhost:3000"

:: Start the app
npm run dev

:: If it closes, pause so user can see any error
pause
