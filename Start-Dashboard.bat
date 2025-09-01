@echo off
title Universal CSV Processor
echo.

echo Starting backend server...
start "Backend-Server" cmd /k "cd Graph-Backend && npm run start-all"

echo Waiting 5 seconds for backend server to start...
timeout /t 5 /nobreak > nul

echo Starting frontend...
start "Frontend" cmd /k "cd Graph-Frontend && npm run serve"

echo.
echo Servers started !
echo.
echo Open your browser at : http://localhost:8080
echo.
echo To stop : close the cmd or type 'taskkill /f /im node.exe'
echo.
pause 