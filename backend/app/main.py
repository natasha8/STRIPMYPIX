"""FastAPI application factory for StripMyPix."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings, setup_logging
from app.routers import analyze, strip


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        Fully configured FastAPI instance with CORS and routers.
    """
    settings = get_settings()
    setup_logging(settings.log_level)

    application = FastAPI(
        title="StripMyPix",
        description="EXIF Privacy Analyzer API",
        version="1.0.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(analyze.router)
    application.include_router(strip.router)

    @application.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
