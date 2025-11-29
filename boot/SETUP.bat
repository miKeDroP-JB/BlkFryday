@echo off
:: ============================================================
::  BRAIN NETWORK V11.5 - GODMODE ULTIMATE
::  SETUP SCRIPT FOR WINDOWS (External Drive Boot)
:: ============================================================
::
::  Run this ONCE to set up the system on your external drive
::
:: ============================================================

title BRAIN NETWORK V11.5 SETUP
color 0B

echo.
echo  ========================================================
echo      BRAIN NETWORK V11.5 - GODMODE ULTIMATE SETUP
echo  ========================================================
echo.
echo  "First and best of its kind in the world"
echo.
echo  ========================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js is not installed!
    echo.
    echo  Please install Node.js first:
    echo  https://nodejs.org/en/download/
    echo.
    echo  After installing, run this setup again.
    echo.
    pause
    exit /b 1
)

:: Show Node version
echo  [OK] Node.js found:
node --version
echo.

:: Get the drive letter where this script is located
set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."

echo  [INFO] Installation directory: %ROOT_DIR%
echo.

:: Navigate to root directory
cd /d "%ROOT_DIR%"

:: Install root dependencies
echo  [1/3] Installing root dependencies...
echo.
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

:: Install web dependencies
echo.
echo  [2/3] Installing web frontend dependencies...
echo.
cd web
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Failed to install web dependencies
    pause
    exit /b 1
)

:: Build the web app
echo.
echo  [3/3] Building web application...
echo.
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo  [WARNING] Build failed - you can still run in dev mode
)

cd ..

:: Create data directories
echo.
echo  [INFO] Creating data directories...
if not exist "data" mkdir data
if not exist "data\v11" mkdir data\v11
if not exist "logs" mkdir logs

:: Done
echo.
echo  ========================================================
echo      SETUP COMPLETE!
echo  ========================================================
echo.
echo  To start the Brain Network, run:
echo.
echo      BOOT.bat
echo.
echo  Or for development mode:
echo.
echo      DEV.bat
echo.
echo  ========================================================
echo.

pause
