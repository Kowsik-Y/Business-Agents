#!/usr/bin/env bash
# ==============================================================================
# AI Business Agents - Run All Servers with Live Logging & Ctrl+C Cleanup
# ==============================================================================

set -m # Enable job control

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/business-agent-server"
MCP_DIR="$ROOT_DIR/business-agent-mcp"
WEB_DIR="$ROOT_DIR/business-agent-web"
LOGS_DIR="$ROOT_DIR/logs"

mkdir -p "$LOGS_DIR"

PYTHON_BIN="$SERVER_DIR/.venv/bin/python"
UVICORN_BIN="$SERVER_DIR/.venv/bin/uvicorn"

if [ ! -f "$PYTHON_BIN" ]; then
    echo "❌ Error: Virtual environment not found at $SERVER_DIR/.venv."
    echo "   Please run './init.sh' first to initialize the project."
    exit 1
fi

SERVER_LOG="$LOGS_DIR/server.log"
MCP_LOG="$LOGS_DIR/mcp.log"
WEB_LOG="$LOGS_DIR/web.log"

> "$SERVER_LOG"
> "$MCP_LOG"
> "$WEB_LOG"

SERVER_PID=""
MCP_PID=""
WEB_PID=""
TAIL_PID=""

cleanup() {
    trap - SIGINT SIGTERM EXIT
    echo ""
    echo "=================================================================="
    echo "🛑 Shutting down all AI Business Agent servers..."
    echo "=================================================================="

    if [ -n "$TAIL_PID" ] && kill -0 "$TAIL_PID" 2>/dev/null; then
        kill "$TAIL_PID" 2>/dev/null || true
    fi

    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "Stopping Backend Server (PID $SERVER_PID)..."
        kill -SIGTERM "$SERVER_PID" 2>/dev/null || true
    fi

    if [ -n "$MCP_PID" ] && kill -0 "$MCP_PID" 2>/dev/null; then
        echo "Stopping MCP Server (PID $MCP_PID)..."
        kill -SIGTERM "$MCP_PID" 2>/dev/null || true
    fi

    if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
        echo "Stopping Web Frontend (PID $WEB_PID)..."
        kill -SIGTERM "$WEB_PID" 2>/dev/null || true
    fi

    # Terminate any remaining child processes of this shell
    kill -- -$$ 2>/dev/null || true

    sleep 1
    echo "✅ All servers stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "=================================================================="
echo "🚀 Starting AI Sales Assistant Multi-Agent System"
echo "=================================================================="

# 1. Start Backend Server (FastAPI + LangGraph + WebSockets on 8000)
echo "Starting Backend Server on http://localhost:8000 ..."
(cd "$SERVER_DIR" && "$UVICORN_BIN" app.main:app --host 0.0.0.0 --port 8000 --reload) > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

# 2. Start MCP Server (Model Context Protocol HTTP on 8001)
echo "Starting MCP Server on http://localhost:8001 ..."
(cd "$MCP_DIR" && PYTHONPATH=".:$SERVER_DIR" "$PYTHON_BIN" server.py --http 8001) > "$MCP_LOG" 2>&1 &
MCP_PID=$!

# 3. Start Next.js Frontend on 3000
echo "Starting Next.js Frontend on http://localhost:3000 ..."
(cd "$WEB_DIR" && npm run dev) > "$WEB_LOG" 2>&1 &
WEB_PID=$!

sleep 2

echo ""
echo "=================================================================="
echo "🌟 All Servers Running! Access points:"
echo "   💻 Web Dashboard:      http://localhost:3000"
echo "   📡 REST API Docs:      http://localhost:8000/docs"
echo "   🔌 WebSocket Endpoint: ws://localhost:8000/ws/sales/{session_id}"
echo "   🤖 MCP Server (HTTP):  http://localhost:8001/mcp/rpc"
echo "   📝 Logs Directory:     $LOGS_DIR"
echo "=================================================================="
echo "Press Ctrl+C at any time to terminate all servers."
echo "Streaming live logs below:"
echo "------------------------------------------------------------------"

# Tail logs with prefixes
tail -n 20 -f "$SERVER_LOG" "$MCP_LOG" "$WEB_LOG" &
TAIL_PID=$!

wait $SERVER_PID $MCP_PID $WEB_PID
