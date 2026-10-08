"""knowledge-service FastAPI application entry point."""

from fastapi import FastAPI

app = FastAPI(title="knowledge-service", version="0.1.0")


@app.get("/health/live")
async def health_live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
async def health_ready() -> dict[str, str]:
    # TODO: Verify required dependencies
    return {"status": "ok"}
