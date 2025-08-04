@echo off
title UK Electricity Dashboard
echo.
echo    UK Electricity Dashboard
echo ================================
echo.

echo Starting all backend services...
start "Backend-Orchestrator" cmd /k "cd Graph-Backend && npm run start-all"

echo Waiting 5 seconds for backend services to start...
timeout /t 5 /nobreak > nul

echo Starting frontend...
start "Frontend" cmd /k "cd Graph-Frontend && npm run serve"

echo.
echo Servers started !
echo.
echo Open your browser at : http://localhost:8080
echo.
echo To stop : close the windows or type 'taskkill /f /im node.exe'
echo.
pause 