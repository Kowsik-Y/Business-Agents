# ==============================================================================
# AI Business Agents - Run All Servers with Live Logging & Ctrl+C Cleanup (Windows)
# ==============================================================================

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Join-Path $RootDir "business-agent-server"
$McpDir = Join-Path $RootDir "business-agent-mcp"
$WebDir = Join-Path $RootDir "business-agent-web"
$LogsDir = Join-Path $RootDir "logs"

if (!(Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

$PythonExe = Join-Path $ServerDir ".venv\Scripts\python.exe"
$UvicornExe = Join-Path $ServerDir ".venv\Scripts\uvicorn.exe"

if (!(Test-Path $PythonExe)) {
    Write-Host "❌ Error: Virtual environment not found at $ServerDir\.venv." -ForegroundColor Red
    Write-Host "   Please run '.\init.ps1' first to initialize the project." -ForegroundColor Yellow
    exit 1
}

$ServerLog = Join-Path $LogsDir "server.log"
$McpLog = Join-Path $LogsDir "mcp.log"
$WebLog = Join-Path $LogsDir "web.log"

"" | Out-File -FilePath $ServerLog -Encoding utf8
"" | Out-File -FilePath $McpLog -Encoding utf8
"" | Out-File -FilePath $WebLog -Encoding utf8

$Processes = @()

function Stop-AllServers {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Yellow
    Write-Host "🛑 Shutting down all AI Business Agent servers..." -ForegroundColor Yellow
    Write-Host "==================================================================" -ForegroundColor Yellow

    foreach ($proc in $Processes) {
        if ($proc -and !$proc.HasExited) {
            try {
                Write-Host "Stopping process $($proc.Id) ($($proc.ProcessName))..." -ForegroundColor DarkYellow
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            } catch {}
        }
    }

    Write-Host "✅ All servers stopped cleanly." -ForegroundColor Green
}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting AI Sales Assistant Multi-Agent System (Windows)" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

try {
    # 1. Start Backend Server on 8000
    Write-Host "Starting Backend Server on http://localhost:8000 ..." -ForegroundColor Green
    $ServerProcess = Start-Process -FilePath $UvicornExe `
        -ArgumentList "app.main:app --host 0.0.0.0 --port 8000 --reload" `
        -WorkingDirectory $ServerDir `
        -RedirectStandardOutput $ServerLog `
        -RedirectStandardError $ServerLog `
        -PassThru -NoNewWindow
    $Processes += $ServerProcess

    # 2. Start MCP Server on 8001
    Write-Host "Starting MCP Server on http://localhost:8001 ..." -ForegroundColor Green
    $env:PYTHONPATH = ".;$ServerDir"
    $McpProcess = Start-Process -FilePath $PythonExe `
        -ArgumentList "server.py --http 8001" `
        -WorkingDirectory $McpDir `
        -RedirectStandardOutput $McpLog `
        -RedirectStandardError $McpLog `
        -PassThru -NoNewWindow
    $Processes += $McpProcess

    # 3. Start Next.js Frontend on 3000
    Write-Host "Starting Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Green
    $WebProcess = Start-Process -FilePath "npm.cmd" `
        -ArgumentList "run dev" `
        -WorkingDirectory $WebDir `
        -RedirectStandardOutput $WebLog `
        -RedirectStandardError $WebLog `
        -PassThru -NoNewWindow
    $Processes += $WebProcess

    Start-Sleep -Seconds 2

    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "🌟 All Servers Running! Access points:" -ForegroundColor Green
    Write-Host "   💻 Web Dashboard:      http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   📡 REST API Docs:      http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "   🔌 WebSocket Endpoint: ws://localhost:8000/ws/sales/{session_id}" -ForegroundColor Cyan
    Write-Host "   🤖 MCP Server (HTTP):  http://localhost:8001/mcp/rpc" -ForegroundColor Cyan
    Write-Host "   📝 Logs Directory:     $LogsDir" -ForegroundColor DarkGray
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "Press Ctrl+C at any time to terminate all servers." -ForegroundColor Yellow
    Write-Host "Streaming logs (Press Ctrl+C to exit)..." -ForegroundColor DarkGray
    Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray

    # Stream logs to console until Ctrl+C
    Get-Content -Path $ServerLog, $McpLog, $WebLog -Wait
}
finally {
    Stop-AllServers
}
