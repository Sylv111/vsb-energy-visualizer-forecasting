@echo off
title Universal CSV Visualizer - PRODUCTION
echo.
echo    Universal CSV Visualizer - PRODUCTION
echo ============================================
echo.

echo Building frontend for production...
cd Graph-Frontend
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)
cd ..

echo.
echo Starting backend service...
start "CSV-Processor" cmd /k "cd Graph-Backend && npm run start-all"

echo Waiting 5 seconds for backend service to start...
timeout /t 5 /nobreak > nul

echo.
echo Production server started!
echo.
echo Production Dashboard: http://localhost:3000
echo API Health: http://localhost:3000/api/health
echo.
echo Note: This is the PRODUCTION version (optimized)
echo.
echo To stop: close the windows or type 'taskkill /f /im node.exe'
echo.
pause