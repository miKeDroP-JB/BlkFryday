# ============================================================
#  BRAIN NETWORK V11.5 - GODMODE ULTIMATE
#  PowerShell Launch Script
# ============================================================
#
#  Right-click and "Run with PowerShell" to start
#
# ============================================================

$Host.UI.RawUI.WindowTitle = "BRAIN NETWORK V11.5 - GODMODE"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

# ASCII Art Banner
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host "       BRAIN NETWORK V11.5 - GODMODE ULTIMATE" -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   10 SYSTEMS | 1007 AGENTS | 50+ STRATEGIES | INFINITE POWER" -ForegroundColor Yellow
Write-Host ""
Write-Host '   "First and best of its kind in the world"' -ForegroundColor Magenta
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please install Node.js from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if setup was run
$webModules = Join-Path $RootDir "web\node_modules"
if (-not (Test-Path $webModules)) {
    Write-Host "  [ERROR] Setup not complete!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Run SETUP.bat first, then try again." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "  [BOOT] Starting Brain Network..." -ForegroundColor Cyan
Write-Host ""

# Change to web directory
Set-Location (Join-Path $RootDir "web")

# Check for production build
$nextDir = Join-Path $RootDir "web\.next"
if (Test-Path $nextDir) {
    Write-Host "  [MODE] Production" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "   OPEN YOUR BROWSER TO: http://localhost:3000" -ForegroundColor White
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor DarkGray
    Write-Host ""

    # Auto-open browser after 3 seconds
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 3
        Start-Process "http://localhost:3000"
    } | Out-Null

    npm start
} else {
    Write-Host "  [MODE] Development (hot reload enabled)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "   OPEN YOUR BROWSER TO: http://localhost:3000" -ForegroundColor White
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor DarkGray
    Write-Host ""

    # Auto-open browser after 5 seconds (dev takes longer to start)
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 5
        Start-Process "http://localhost:3000"
    } | Out-Null

    npm run dev
}
