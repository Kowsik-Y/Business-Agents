# AI Agent Engineering Workshop
## Build & Ship an AI Sales Assistant Automation System

Welcome to the AI Agent Engineering Workshop repository. This project demonstrates how to build and ship an autonomous **AI Sales Assistant** using **LangGraph**, **LangChain**, real-time **WebSockets**, and the **Model Context Protocol (MCP)**.

---

## 🧭 Repository Structure

```
.
├── ARCHITECTURE.md          # Complete Architectural Specification & Diagrams
├── business-agent-server/   # Backend: FastAPI, LangGraph, LangChain, WebSockets
│   ├── .venv/               # Virtual environment
│   ├── requirements.txt     # Python dependencies
│   ├── app/                 # FastAPI application & LangGraph state machine
│   └── tests/               # Automated test suite (pytest)
│
├── business-agent-mcp/      # Model Context Protocol (MCP) Server
│   ├── server.py            # MCP Server (JSON-RPC 2.0 / Stdio & HTTP)
│   ├── tools.py             # Tools catalog (CRM, Enrichment, Scoring)
│   ├── resources.py         # Knowledge resources (playbooks, pricing)
│   ├── prompts.py           # Prompt templates
│   └── mcp_config.json      # Client configuration for Claude Desktop / Cursor
│
└── business-agent-web/      # Frontend Dashboard (Next.js + shadcn/ui)
```

---

## ⚡ Quick Start

### 1. Run the Backend Server (`business-agent-server`)

```bash
cd business-agent-server
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **REST API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Live WebSocket Endpoint**: `ws://localhost:8000/ws/sales/{session_id}`
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Run the MCP Server (`business-agent-mcp`)

#### Option A: HTTP Mode
```bash
cd business-agent-mcp
PYTHONPATH=.:../business-agent-server ../business-agent-server/.venv/bin/python server.py --http 8001
```

#### Option B: Stdio Mode (Claude Desktop / Cursor)
Use configuration file [mcp_config.json](file:///Users/kowsik/Documents/Business-Agents/business-agent-mcp/mcp_config.json):
```json
{
  "mcpServers": {
    "sales-assistant": {
      "command": "${workspaceFolder}/business-agent-server/.venv/bin/python",
      "args": [
        "${workspaceFolder}/business-agent-mcp/server.py"
      ],
      "env": {
        "PYTHONPATH": "${workspaceFolder}/business-agent-server:${workspaceFolder}/business-agent-mcp"
      }
    }
  }
}
```

### 3. Run the Web Interface (`business-agent-web`)

```bash
cd business-agent-web
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Validation

### Run Server Tests
```bash
cd business-agent-server
.venv/bin/python -m pytest tests/
```

### Run MCP Protocol Tests
```bash
PYTHONPATH=business-agent-mcp:business-agent-server ./business-agent-server/.venv/bin/python -m pytest business-agent-mcp/test_mcp.py
```

---

## 📖 System Architecture

For detailed flowcharts, state transitions, WebSocket message contracts, and MCP specifications, see [ARCHITECTURE.md](file:///Users/kowsik/Documents/Business-Agents/ARCHITECTURE.md).
