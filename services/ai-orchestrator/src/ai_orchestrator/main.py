"""AI Orchestrator FastAPI application entry point.
@see docs/07-ai-orchestrator.md
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_orchestrator.routes.health import router as health_router
from ai_orchestrator.routes.turns import router as turns_router

app = FastAPI(
    title="AI Orchestrator API",
    description="Stateful LLM conversational reasoning service using LangGraph and LangChain",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health_router)
app.include_router(turns_router)


if __name__ == "__main__":
    import uvicorn
    from ai_orchestrator.config import settings

    uvicorn.run("ai_orchestrator.main:app", host=settings.host, port=settings.port, reload=True)
