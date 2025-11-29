@echo off
:: ============================================================
::  BRAIN NETWORK V11.5 - GODMODE ULTIMATE
::  BOOT SCRIPT (Production Mode)
:: ============================================================
::
::  Double-click this file to start the Brain Network!
::
:: ============================================================

title BRAIN NETWORK V11.5 - GODMODE ULTIMATE
color 0B

:: Get the drive letter where this script is located
set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."

cls
echo.
echo  ========================================================
echo       BRAIN NETWORK V11.5 - GODMODE ULTIMATE
echo  ========================================================
echo.
echo   10 SYSTEMS - 1007 AGENTS - 50+ STRATEGIES - INFINITE POWER
echo.
echo  ========================================================
echo.
echo   "First and best of its kind in the world"
echo.
echo  ========================================================
echo.

:: Check if setup was run
if not exist "%ROOT_DIR%\web\node_modules" (
    echo  [ERROR] Setup not complete!
    echo.
    echo  Please run SETUP.bat first.
    echo.
    pause
    exit /b 1
)

:: Navigate to web directory
cd /d "%ROOT_DIR%\web"

:: Check if production build exists
if exist ".next" (
    echo  [BOOT] Starting in PRODUCTION mode...
    echo.
    echo  --------------------------------------------------------
    echo   Open your browser to: http://localhost:3000
    echo  --------------------------------------------------------
    echo.
    echo   Press Ctrl+C to stop the server
    echo.

    :: Start production server
    call npm start
) else (
    echo  [BOOT] No production build found, starting in DEV mode...
    echo.
    echo  --------------------------------------------------------
    echo   Open your browser to: http://localhost:3000
    echo  --------------------------------------------------------
    echo.
    echo   Press Ctrl+C to stop the server
    echo.

    :: Start dev server
    call npm run dev
)

pause
