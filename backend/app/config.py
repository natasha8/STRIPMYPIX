"""Application configuration via environment variables."""

from __future__ import annotations

import logging

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_DEV_ORIGIN = "http://localhost:3000"


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables.

    Attributes:
        allowed_origins_csv: Comma-separated CORS origins (env ``ALLOWED_ORIGINS``).
        allowed_origins: Parsed list of origins for ``CORSMiddleware``.
        max_upload_bytes: Maximum upload size in bytes (default 12 MB).
        max_pixels: Maximum total pixel count before downscaling (default 24 M).
        log_level: Python logging level name.
    """

    allowed_origins_csv: str = Field(
        default=_DEFAULT_DEV_ORIGIN,
        validation_alias="ALLOWED_ORIGINS",
        description=(
            "Comma-separated browser origins for CORS, e.g. "
            f"https://myapp.vercel.app,{_DEFAULT_DEV_ORIGIN}"
        ),
    )
    max_upload_bytes: int = 12 * 1024 * 1024
    max_pixels: int = 24_000_000
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        """Browser origins allowed by CORS, parsed from ``ALLOWED_ORIGINS``.

        Plain property (not a Pydantic field) so ``ALLOWED_ORIGINS`` is only
        bound to ``allowed_origins_csv`` and pydantic-settings does not try to
        JSON-parse this name from the environment.
        """
        raw = self.allowed_origins_csv.strip()
        if not raw:
            return [_DEFAULT_DEV_ORIGIN]
        parts = [p.strip() for p in raw.split(",") if p.strip()]
        return parts if parts else [_DEFAULT_DEV_ORIGIN]


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
