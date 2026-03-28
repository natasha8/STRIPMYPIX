"""Upload validation service.

Validates file size and MIME type before processing.
"""

from __future__ import annotations

import logging

from fastapi import HTTPException, UploadFile

from app.config import Settings

logger = logging.getLogger("stripmypix")

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/webp",
}


def validate_upload(
    file: UploadFile, image_bytes: bytes, settings: Settings
) -> None:
    """Validate an uploaded file's size and MIME type.

    Args:
        file: The FastAPI UploadFile instance.
        image_bytes: Already-read file bytes (to check actual size).
        settings: Application settings with max_upload_bytes.

    Raises:
        HTTPException: 413 if file exceeds size limit, 415 if type unsupported.
    """
    if len(image_bytes) > settings.max_upload_bytes:
        max_mb = settings.max_upload_bytes / (1024 * 1024)
        logger.warning("Upload too large: %d bytes", len(image_bytes))
        raise HTTPException(
            status_code=413,
            detail={
                "detail": f"File exceeds {max_mb:.0f} MB limit",
                "code": "FILE_TOO_LARGE",
            },
        )

    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        logger.warning("Unsupported content type: %s", content_type)
        raise HTTPException(
            status_code=415,
            detail={
                "detail": f"Unsupported file type: {content_type}",
                "code": "UNSUPPORTED_TYPE",
            },
        )
