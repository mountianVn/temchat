@echo off
setlocal enabledelayedexpansion

:: Move to the folder containing this script
cd /d "%~dp0"

echo --------------------------------------------------
echo GitHub Auto Upload Script
echo Repository root: %CD%
echo --------------------------------------------------

git status --short --branch
echo.
set /p COMMIT_MSG=Enter commit message (press Enter for "Auto-update"): 
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Auto-update
echo.
git add -A
echo Committing changes...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo No changes committed or commit failed.
    goto end
)
echo Pushing to GitHub...
git push origin HEAD
if errorlevel 1 (
    echo Push failed. Check your Git remote and credentials.
) else (
    echo Push completed successfully.
)

:end
echo.
pause