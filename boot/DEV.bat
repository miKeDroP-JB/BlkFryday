@echo off
:: ============================================================
::  BRAIN NETWORK V11.5 - DEVELOPMENT MODE
:: ============================================================

title BRAIN NETWORK V11.5 - DEV MODE
color 0A

set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."

cls
echo.
echo  ========================================================
echo       BRAIN NETWORK V11.5 - DEVELOPMENT MODE
echo  ========================================================
echo.
echo   Hot reload enabled - changes auto-refresh
echo.
echo  ========================================================
echo.

cd /d "%ROOT_DIR%\web"

echo  [DEV] Starting development server...
echo.
echo  --------------------------------------------------------
echo   Open your browser to: http://localhost:3000
echo  --------------------------------------------------------
echo.
echo   - Press Ctrl+C to stop
echo   - Edit files and see changes live
echo.

call npm run dev

pause
