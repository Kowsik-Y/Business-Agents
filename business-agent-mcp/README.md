# Business Agent Model Context Protocol (MCP) Server

This server exposes the **AI Sales Assistant** tools, knowledge resources, and prompt templates conforming to the official **Model Context Protocol (MCP)** specification (`2024-11-05`).

---

## 🛠 Features

- **Tools (`tools/list`, `tools/call`)**:
  - `crm_lookup_lead`: Look up existing CRM records for an email.
  - `enrich_company_profile`: Enriches company domain with tech stack, headcount, ARR, and funding.
  - `calculate_lead_score`: Calculates quantitative BANT qualification score (0-100).
  - `run_sales_assistant`: Executes full LangGraph sales workflow.
- **Resources (`resources/list`, `resources/read`)**:
  - `business://sales/playbook`: B2B Sales Playbook & BANT framework.
  - `business://sales/pricing-tiers`: Commercial pricing packages and limits.
  - `business://sales/objection-handling`: Battle cards for prospect objections.
- **Prompts (`prompts/list`, `prompts/get`)**:
  - `qualify-sales-lead`: Standard prompt to evaluate lead BANT readiness.
  - `draft-sales-outreach`: Standard prompt to craft tailored executive pitch.

---

## 🚀 How to Run

### 1. Stdio Mode (for Claude Desktop, Cursor, Antigravity IDE)

Add the following to your MCP client configuration (`claude_desktop_config.json` or `.cursor/mcp.json`):

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

### 2. HTTP / JSON-RPC Mode

To run as an HTTP microservice on port 8001:

```bash
cd business-agent-mcp
PYTHONPATH=.:../business-agent-server ../business-agent-server/.venv/bin/python server.py --http 8001
```

Test via `curl`:

```bash
curl -X POST http://localhost:8001/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "calculate_lead_score",
      "arguments": {
        "company_size": 220,
        "budget": 50000,
        "timeline_months": 2,
        "has_authority": true
      }
    }
  }'
```

---

## 🧪 Testing

Run MCP automated unit tests:

```bash
PYTHONPATH=business-agent-mcp:business-agent-server ./business-agent-server/.venv/bin/python -m pytest business-agent-mcp/test_mcp.py
```
