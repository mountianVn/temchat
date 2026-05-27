@echo off
chcp 65001 >nul
title TeamChat Server

echo ============================================
echo    TeamChat Server - Local Network Edition
echo ============================================
echo.

:: Check if port 3001 is in use
netstat -ano | findstr :3001 >nul
if %ERRORLEVEL% equ 0 (
    echo [WARNING] Port 3001 is already in use!
    echo.
    echo Check what's using it:
    netstat -ano | findstr :3001
    echo.
    echo Press any key to continue anyway...
    pause >nul
)

:: Open firewall
echo Opening firewall for port 3001...
netsh advfirewall firewall add rule name="TeamChat" dir=in action=allow protocol=tcp localport=3001 >nul 2>&1
echo [OK] Firewall configured
echo.

:: Start server
echo Starting TeamChat server...
echo.
echo Server will run at:
echo   - Local:   http://localhost:3001
echo   - Network: http://10.222.243.106:3001
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0server"
npm run dev
