"""Voice Service FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from voice_service.config import settings
from voice_service.routes.health import router as health_router
from voice_service.routes.sessions import router as sessions_router
from voice_service.routes.websocket import router as websocket_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="FastAPI Voice Service with live WebSockets, VAD endpointing, STT, and TTS audio synthesis.",
)

# Enable CORS for customer-web and browser clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(sessions_router)
app.include_router(websocket_router)
