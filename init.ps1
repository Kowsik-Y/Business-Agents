# ==============================================================================
# AI Business Agents - Project Initialization Script (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "🚀 Initializing AI Sales Assistant Multi-Agent Project (Windows)" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Create logs directory
$LogsDir = Join-Path $RootDir "logs"
if (!(Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

# 2. Check Python
try {
    $pythonVer = & python --version 2>&1
    Write-Host "✓ Detected: $pythonVer" -ForegroundColor Green
} catch {
    Write-Error "Python is not installed or not in PATH."
}

# 3. Virtual Environment
$ServerDir = Join-Path $RootDir "business-agent-server"
$VenvDir = Join-Path $ServerDir ".venv"
$PythonExe = Join-Path $VenvDir "Scripts\python.exe"

if (!(Test-Path $VenvDir)) {
    Write-Host "📦 Creating virtual environment in $VenvDir..." -ForegroundColor Yellow
    & python -m venv $VenvDir
}

Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
$ReqFile = Join-Path $ServerDir "requirements.txt"
& $PythonExe -m pip install --upgrade pip --quiet
& $PythonExe -m pip install -r $ReqFile --quiet

# 4. Copy .env.example if .env does not exist
$EnvExample = Join-Path $ServerDir ".env.example"
$EnvFile = Join-Path $ServerDir ".env"
if (!(Test-Path $EnvFile) -and (Test-Path $EnvExample)) {
    Copy-Item $EnvExample $EnvFile
    Write-Host "✓ Created $EnvFile from template" -ForegroundColor Green
}

# 5. Frontend Dependencies
$WebDir = Join-Path $RootDir "business-agent-web"
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "📦 Installing Next.js frontend dependencies..." -ForegroundColor Yellow
    Push-Location $WebDir
    & npm install --silent
    Pop-Location
} else {
    Write-Host "⚠️ Warning: npm not found. Frontend install skipped." -ForegroundColor DarkYellow
}

# 6. Run verification tests
Write-Host "🧪 Running verification tests..." -ForegroundColor Yellow
$TestsDir = Join-Path $ServerDir "tests"
$McpTest = Join-Path $RootDir "business-agent-mcp\test_mcp.py"

& $PythonExe -m pytest $TestsDir --quiet
& $PythonExe -m pytest $McpTest --quiet

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "✅ Initialization Complete!" -ForegroundColor Green
Write-Host "   To start the servers with full log output and Ctrl+C cleanup:" -ForegroundColor Green
Write-Host "   powershell -ExecutionPolicy Bypass -File .\run.ps1" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Green
