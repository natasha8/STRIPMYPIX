"""POST /analyze endpoint — extract EXIF metadata and score privacy risk."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, UploadFile, File
from PIL import Image
import io

from app.config import Settings, get_settings
from app.schemas import AnalysisResponse
from app.services.exif import (
    extract_metadata,
    calculate_risk_score,
    maybe_downscale,
)
from app.services.validation import validate_upload

logger = logging.getLogger("stripmypix")
router = APIRouter()


def _detect_format(image_bytes: bytes) -> str:
    """Detect the image format from raw bytes.

    Args:
        image_bytes: Raw image bytes.

    Returns:
        Uppercase format string (JPEG, PNG, etc.).
    """
    img = Image.open(io.BytesIO(image_bytes))
    return img.format or "JPEG"


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> AnalysisResponse:
    """Analyze uploaded image for EXIF metadata and privacy risk.

    Args:
        file: Uploaded image file.
        settings: Injected application settings.

    Returns:
        AnalysisResponse with risk score, findings, GPS, and metadata.
    """
    image_bytes = await file.read()
    validate_upload(file, image_bytes, settings)

    image_format = _detect_format(image_bytes)  # safe: validation passed
    image_bytes, downscaled = maybe_downscale(
        image_bytes, settings.max_pixels, image_format
    )

    result = extract_metadata(image_bytes)
    risk_score = calculate_risk_score(result.findings)

    logger.info(
        "Analyzed %s: score=%d findings=%d",
        file.filename,
        risk_score,
        len(result.findings),
    )

    return AnalysisResponse(
        risk_score=risk_score,
        findings=result.findings,
        gps=result.gps,
        filename=file.filename or "unknown",
        downscaled=downscaled,
    )
