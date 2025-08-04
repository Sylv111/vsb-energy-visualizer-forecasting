@echo off
title UK Electricity Dashboard - PRODUCTION
echo.
echo    UK Electricity Dashboard - PRODUCTION
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
echo Starting all backend services...
start "Backend-Orchestrator" cmd /k "cd Graph-Backend && npm run start-all"

echo Waiting 5 seconds for backend services to start...
timeout /t 5 /nobreak > nul

echo.
echo Production servers started !
echo.
echo Production Dashboard: http://localhost:3000
echo API Health: http://localhost:3000/api/health
echo Electricity API: http://localhost:3001
echo Gas API: http://localhost:3002
echo.
echo Note: This is the PRODUCTION version (optimized)
echo.
echo To stop: close the windows or type 'taskkill /f /im node.exe'
echo.
pause 