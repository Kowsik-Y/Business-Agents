# AI Sales Assistant Server (LangGraph + LangChain)

Backend for the **AI Sales Assistant**, part of the **AI Agent Engineering Workshop**.
Built using **LangGraph**, **LangChain**, **FastAPI**, **WebSockets**, and **Model Context Protocol (MCP)**.

---

## 🏗 Architecture

The AI Sales Assistant executes a multi-step state graph:
```
[START]
   │
   ▼
[capture_lead]     ── Extrapolates contact info & domain
   │
   ▼
[enrich_lead]      ── Invokes CRM lookup & Company enrichment tools
   │
   ▼
[qualify_lead]     ── Evaluates BANT criteria (Budget, Authority, Need, Timeline)
   │
   ▼
[score_lead]       ── Computes quantitative score (0-100) & qualification status
   │
   ├── [status == 'qualified']    ──► [draft_outreach] ──► [END]
   ├── [status == 'nurture']      ──► [nurture_lead]   ──► [END]
   └── [status == 'disqualified'] ──► [archive_lead]   ──► [END]
```

### LangGraph State (`SalesAgentState`)
- `messages`: Chronological chat messages with LangChain reducers.
- `lead_input`: Contact email, company, notes, budget.
- `crm_record`: Historical account and past interactions.
- `enriched_data`: Tech stack, ARR, employee count, funding.
- `qualification`: BANT analysis breakdown.
- `score`: Quantitative lead score (0-100).
- `status`: Verdict (`qualified`, `nurture`, `disqualified`).
- `outreach_plan`: Tailored cold email pitch or nurture schedule.
- `audit_trail`: Traceable execution history across graph nodes.

---

## 📡 Endpoints

### 1. Real-Time WebSocket (`/ws/sales/{session_id}`)
Bi-directional streaming connection.
- **Client sends**:
  ```json
  {
    "action": "run",
    "prompt": "Qualify lead Alex Mercer at alex@acmecorp.com",
    "lead": { "email": "alex@acmecorp.com" }
  }
  ```
- **Server streams**:
  - `connected`: Handshake confirmation.
  - `graph_start`: Execution started.
  - `node_complete`: Each node output as it finishes.
  - `tool_result`: Real-time data from CRM and enrichment tools.
  - `state_update`: Live score and qualification update.
  - `outreach_ready`: Final personalized email.
  - `graph_complete`: Full run summary and audit trail.

### 2. REST API (`/api/v1/sales`)
- `POST /api/v1/sales/run`: Execute the sales assistant pipeline.
- `POST /api/v1/sales/lead`: Direct lead qualification.
- `GET /api/v1/sales/state/{session_id}`: Inspect checkpointed memory state.
- `GET /api/v1/sales/tools`: Catalog of available tools with schemas.
- `GET /health`: Health check.

---

## 🚀 Setup & Running

```bash
# 1. Activate Virtual Environment
source .venv/bin/activate

# 2. Install Dependencies (if not already installed)
pip install -r requirements.txt

# 3. Start the Server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger documentation is available at: `http://localhost:8000/docs`

---

## 🧪 Testing

Run automated tests:

```bash
pytest tests/
```
