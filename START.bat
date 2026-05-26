@echo off
chcp 65001 >nul
title TeamChat - Starting...

echo ============================================
echo    TeamChat - Internal Chat App
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version
echo.

:: Install dependencies
echo [1/3] Installing dependencies...
echo.
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
    echo.
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
    echo.
)

:: Start servers
echo [2/3] Starting servers...
echo.

:: Start backend server in new window
start "TeamChat Server (Port 3001)" cmd /k "cd server && npm run dev"

:: Wait a bit
timeout /t 3 /nobreak >nul

:: Start frontend in new window  
start "TeamChat Frontend (Port 5173)" cmd /k "cd client && npm run dev"

:: Open browser
echo [3/3] Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo ============================================
echo    TeamChat is ready!
echo ============================================
echo.
echo Login page:  http://localhost:5173
echo API server:  http://localhost:3001
echo.
echo Demo accounts:
echo   alice, bob, carol, david, emma, frank, grace, henry
echo   Password: password123
echo.
echo Close this window or press any key to exit.
echo The servers will keep running in their windows.
pause >nul
