#!/usr/bin/env bash
# ==============================================================================
# AI Business Agents - Project Initialization Script (macOS / Linux)
# ==============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo ""
echo "=================================================================="
echo "🚀 Initializing AI Sales Assistant Multi-Agent Project"
echo "=================================================================="

# 1. Create logs directory
mkdir -p "$ROOT_DIR/logs"

# 2. Check Python version
if ! command -v python3 &>/dev/null; then
    echo "❌ Error: python3 is not installed or not in PATH."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1)
echo "✓ Detected: $PYTHON_VERSION"

# 3. Initialize Python Virtual Environment for business-agent-server
SERVER_DIR="$ROOT_DIR/business-agent-server"
VENV_DIR="$SERVER_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment in $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
fi

if ! "$VENV_DIR/bin/python" -c "import langgraph, langchain, fastapi" &>/dev/null; then
    echo "📦 Installing Python dependencies in $VENV_DIR..."
    if command -v uv &>/dev/null; then
        uv pip install --python "$VENV_DIR/bin/python" -r "$SERVER_DIR/requirements.txt" || "$VENV_DIR/bin/python" -m pip install -r "$SERVER_DIR/requirements.txt"
    else
        "$VENV_DIR/bin/python" -m pip install -r "$SERVER_DIR/requirements.txt"
    fi
else
    echo "✓ Python dependencies already installed in .venv"
fi

# 4. Copy .env.example if .env does not exist
if [ ! -f "$SERVER_DIR/.env" ] && [ -f "$SERVER_DIR/.env.example" ]; then
    cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
    echo "✓ Created $SERVER_DIR/.env from template"
fi

# 5. Check Node & Install Frontend Dependencies for business-agent-web
WEB_DIR="$ROOT_DIR/business-agent-web"
if command -v npm &>/dev/null; then
    echo "📦 Installing Next.js frontend dependencies in $WEB_DIR..."
    cd "$WEB_DIR" && npm install --silent
    cd "$ROOT_DIR"
else
    echo "⚠️ Warning: npm is not installed. Frontend dependencies skipped."
fi

# 6. Verify Test Suites
echo "🧪 Running verification tests on business-agent-server and business-agent-mcp..."
"$VENV_DIR/bin/python" -m pytest "$SERVER_DIR/tests" --quiet
"$VENV_DIR/bin/python" -m pytest "$ROOT_DIR/business-agent-mcp/test_mcp.py" --quiet

echo ""
echo "=================================================================="
echo "✅ Initialization Complete!"
echo "   To start the servers with full log output and Ctrl+C cleanup:"
echo "   $ ./run.sh"
echo "=================================================================="
