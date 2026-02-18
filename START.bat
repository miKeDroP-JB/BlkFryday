@echo off
:: ============================================================
::  BRAIN NETWORK V11.5 - GODMODE ULTIMATE
::  QUICK START LAUNCHER
:: ============================================================
::
::  Double-click this file to start!
::
:: ============================================================

title BRAIN NETWORK V11.5 - GODMODE ULTIMATE
color 0B

cls
echo.
echo  ================================================================
echo       BRAIN NETWORK V11.5 - GODMODE ULTIMATE
echo  ================================================================
echo.
echo   10 SYSTEMS ^| 1007 AGENTS ^| 50+ STRATEGIES ^| INFINITE POWER
echo.
echo   "First and best of its kind in the world"
echo.
echo  ================================================================
echo.

:: Check if setup was run
if not exist "%~dp0web\node_modules" (
    echo  [!] First time setup detected...
    echo.
    echo  Running SETUP - this may take a few minutes...
    echo.
    call "%~dp0boot\SETUP.bat"
    if %ERRORLEVEL% NEQ 0 exit /b 1
)

:: Launch the application
call "%~dp0boot\BOOT.bat"
