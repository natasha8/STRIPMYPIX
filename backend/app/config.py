"""Application configuration via environment variables."""

from __future__ import annotations

import logging
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables.

    Attributes:
        allowed_origins: CORS origins allowed to call the API.
        max_upload_bytes: Maximum upload size in bytes (default 12 MB).
        max_pixels: Maximum total pixel count before downscaling (default 24 M).
        log_level: Python logging level name.
    """

    allowed_origins: list[str] = ["http://localhost:3000"]
    max_upload_bytes: int = 12 * 1024 * 1024
    max_pixels: int = 24_000_000
    log_level: str = "INFO"

    model_config = {"env_prefix": "", "env_file": ".env", "extra": "ignore"}


def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configure and return the application logger.

    Args:
        level: Logging level name (DEBUG, INFO, WARNING, ERROR).

    Returns:
        Configured logger for the stripmypix namespace.
    """
    logger = logging.getLogger("stripmypix")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        )
        logger.addHandler(handler)
    return logger
