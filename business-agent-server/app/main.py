"""
FastAPI Main Application for AI Sales Assistant Hub.
Serves LangGraph workflow, WebSocket streaming, and REST endpoints.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.sales_routes import router as sales_router
from app.websocket.router import router as websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup banner
    print("\n" + "="*60)
    print("🚀 AI Sales Assistant Hub (LangGraph + LangChain)")
    print(f"📡 REST API: http://{settings.HOST}:{settings.PORT}/api/v1/sales")
    print(f"🔌 WebSocket: ws://{settings.HOST}:{settings.PORT}/ws/sales/{{session_id}}")
    print(f"📖 Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print("="*60 + "\n")
    yield


app = FastAPI(
    title="AI Sales Assistant Hub",
    description="Multi-Step AI Sales Automation built with LangGraph, LangChain, WebSockets & MCP.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js web application
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(sales_router)
app.include_router(websocket_router)


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Sales Assistant Hub",
        "framework": "LangGraph + LangChain",
        "agent": "AI Sales Assistant",
        "version": "1.0.0"
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "AI Sales Assistant API is running",
        "docs_url": "/docs",
        "websocket_url": "/ws/sales/{session_id}",
        "endpoints": {
            "run_pipeline": "POST /api/v1/sales/run",
            "qualify_lead": "POST /api/v1/sales/lead",
            "get_session_state": "GET /api/v1/sales/state/{session_id}",
            "list_tools": "GET /api/v1/sales/tools"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
