"""POST /strip endpoint — remove all metadata and return clean image."""

from __future__ import annotations

import io
import logging

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from PIL import Image

from app.config import Settings, get_settings
from app.services.exif import strip_metadata, maybe_downscale
from app.services.validation import validate_upload

logger = logging.getLogger("stripmypix")
router = APIRouter()

FORMAT_TO_MIME = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "TIFF": "image/tiff",
    "WEBP": "image/webp",
}

FORMAT_TO_EXT = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "TIFF": ".tiff",
    "WEBP": ".webp",
}


@router.post("/strip")
async def strip_image(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> StreamingResponse:
    """Strip all EXIF metadata from an uploaded image and return the clean file.

    Args:
        file: Uploaded image file.
        settings: Injected application settings.

    Returns:
        StreamingResponse with the cleaned image bytes.
    """
    image_bytes = await file.read()
    validate_upload(file, image_bytes, settings)

    img = Image.open(io.BytesIO(image_bytes))
    image_format = img.format or "JPEG"
    img.close()

    image_bytes, _ = maybe_downscale(image_bytes, settings.max_pixels, image_format)
    clean_bytes = strip_metadata(image_bytes, image_format)

    mime = FORMAT_TO_MIME.get(image_format, "application/octet-stream")
    ext = FORMAT_TO_EXT.get(image_format, ".bin")
    original_name = file.filename or "image"
    stem = original_name.rsplit(".", 1)[0] if "." in original_name else original_name
    clean_name = f"{stem}_stripped{ext}"

    logger.info("Stripped %s → %s (%d bytes)", file.filename, clean_name, len(clean_bytes))

    return StreamingResponse(
        io.BytesIO(clean_bytes),
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{clean_name}"'},
    )
