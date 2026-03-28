"""Pure-Python EXIF extraction, scoring, and stripping service.

This module has NO FastAPI dependency. It receives raw bytes and returns
Pydantic models or plain bytes.
"""

from __future__ import annotations

import io
import logging
import math
from dataclasses import dataclass, field

from PIL import Image
import piexif

from app.schemas import Finding, GpsCoord

logger = logging.getLogger("stripmypix")

CATEGORY_GPS = "GPS Location"
CATEGORY_CAMERA = "Camera Model"
CATEGORY_SOFTWARE = "Software"
CATEGORY_TIMESTAMP = "Timestamp"
CATEGORY_SERIAL = "Serial Number"
CATEGORY_LENS = "Lens Info"

PENALTY_GPS = 50
PENALTY_SERIAL = 20
PENALTY_TIMESTAMP = 10
PENALTY_CAMERA = 10


@dataclass(frozen=True)
class ExtractionResult:
    """Outcome of EXIF metadata extraction.

    Attributes:
        findings: Individual metadata findings with risk levels.
        gps: Parsed GPS coordinates, if present.
    """

    findings: list[Finding] = field(default_factory=list)
    gps: GpsCoord | None = None


def _dms_to_decimal(dms: tuple, ref: str) -> float:
    """Convert EXIF DMS (degrees/minutes/seconds) to decimal degrees.

    Args:
        dms: Tuple of ((d_num, d_den), (m_num, m_den), (s_num, s_den)).
        ref: Cardinal reference letter (N, S, E, W).

    Returns:
        Decimal degree value, negative for S/W.
    """
    degrees = dms[0][0] / dms[0][1]
    minutes = dms[1][0] / dms[1][1]
    seconds = dms[2][0] / dms[2][1]
    decimal = degrees + minutes / 60 + seconds / 3600
    if ref in ("S", "W"):
        decimal = -decimal
    return round(decimal, 6)


def _safe_decode(value: bytes | str | int | tuple) -> str:
    """Decode EXIF value to a human-readable string.

    Args:
        value: Raw EXIF tag value (bytes, str, int, or tuple).

    Returns:
        Decoded string representation.
    """
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace").strip().rstrip("\x00")
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, tuple) and len(value) == 2:
        num, den = value
        if den and den != 0:
            return str(round(num / den, 2))
        return str(num)
    return str(value)


def extract_metadata(image_bytes: bytes) -> ExtractionResult:
    """Extract EXIF metadata findings from raw image bytes.

    Scans for GPS, camera model, software, timestamps, serial numbers,
    and lens information.

    Args:
        image_bytes: Raw bytes of a JPEG/TIFF/WebP image.

    Returns:
        ExtractionResult with all findings and parsed GPS if available.
    """
    try:
        exif_dict = piexif.load(image_bytes)
    except Exception:
        logger.debug("No EXIF data found or failed to parse")
        return ExtractionResult()

    findings: list[Finding] = []
    gps: GpsCoord | None = None

    gps_data = exif_dict.get("GPS", {})
    if (
        piexif.GPSIFD.GPSLatitude in gps_data
        and piexif.GPSIFD.GPSLongitude in gps_data
    ):
        try:
            lat_ref = gps_data.get(piexif.GPSIFD.GPSLatitudeRef, b"N")
            lng_ref = gps_data.get(piexif.GPSIFD.GPSLongitudeRef, b"E")
            if isinstance(lat_ref, bytes):
                lat_ref = lat_ref.decode()
            if isinstance(lng_ref, bytes):
                lng_ref = lng_ref.decode()

            lat = _dms_to_decimal(gps_data[piexif.GPSIFD.GPSLatitude], lat_ref)
            lng = _dms_to_decimal(gps_data[piexif.GPSIFD.GPSLongitude], lng_ref)
            gps = GpsCoord(lat=lat, lng=lng)
            findings.append(
                Finding(
                    category=CATEGORY_GPS,
                    value=f"{lat}, {lng}",
                    risk="critical",
                )
            )
        except Exception:
            logger.debug("Failed to parse GPS data", exc_info=True)

    exif_ifd = exif_dict.get("Exif", {})
    zeroth_ifd = exif_dict.get("0th", {})

    model_tag = zeroth_ifd.get(piexif.ImageIFD.Model)
    if model_tag:
        findings.append(
            Finding(
                category=CATEGORY_CAMERA,
                value=_safe_decode(model_tag),
                risk="medium",
            )
        )

    software_tag = zeroth_ifd.get(piexif.ImageIFD.Software)
    if software_tag:
        findings.append(
            Finding(
                category=CATEGORY_SOFTWARE,
                value=_safe_decode(software_tag),
                risk="low",
            )
        )

    datetime_tag = exif_ifd.get(piexif.ExifIFD.DateTimeOriginal) or zeroth_ifd.get(
        piexif.ImageIFD.DateTime
    )
    if datetime_tag:
        findings.append(
            Finding(
                category=CATEGORY_TIMESTAMP,
                value=_safe_decode(datetime_tag),
                risk="medium",
            )
        )

    serial_tag = exif_ifd.get(piexif.ExifIFD.BodySerialNumber)
    if serial_tag:
        findings.append(
            Finding(
                category=CATEGORY_SERIAL,
                value=_safe_decode(serial_tag),
                risk="high",
            )
        )

    lens_tag = exif_ifd.get(piexif.ExifIFD.LensModel)
    if lens_tag:
        findings.append(
            Finding(
                category=CATEGORY_LENS,
                value=_safe_decode(lens_tag),
                risk="low",
            )
        )

    return ExtractionResult(findings=findings, gps=gps)


def calculate_risk_score(findings: list[Finding]) -> int:
    """Calculate a privacy risk score from 0 (critical) to 100 (safe).

    Scoring: start at 100, deduct per category found:
      GPS -50, Serial -20, Timestamp -10, Camera -10.

    Args:
        findings: List of metadata findings.

    Returns:
        Integer score clamped to 0-100.
    """
    score = 100
    categories = {f.category for f in findings}

    if CATEGORY_GPS in categories:
        score -= PENALTY_GPS
    if CATEGORY_SERIAL in categories:
        score -= PENALTY_SERIAL
    if CATEGORY_TIMESTAMP in categories:
        score -= PENALTY_TIMESTAMP
    if CATEGORY_CAMERA in categories:
        score -= PENALTY_CAMERA

    return max(0, min(100, score))


def strip_metadata(image_bytes: bytes, image_format: str) -> bytes:
    """Remove all EXIF/metadata from an image.

    For JPEG: attempts piexif.remove() first, falls back to re-encoding
    via a clean Image paste. For PNG: re-saves without pnginfo.

    Args:
        image_bytes: Raw image bytes.
        image_format: Uppercase format string (JPEG, PNG, TIFF, WEBP).

    Returns:
        Clean image bytes with metadata removed.
    """
    if image_format == "JPEG":
        try:
            return piexif.remove(image_bytes)
        except Exception:
            logger.debug("piexif.remove failed, falling back to re-encode")

    img = Image.open(io.BytesIO(image_bytes))
    clean = Image.new(img.mode, img.size)
    clean.paste(img)

    buf = io.BytesIO()
    save_kwargs: dict = {}
    if image_format == "JPEG":
        save_kwargs["quality"] = 85
    clean.save(buf, format=image_format, **save_kwargs)
    return buf.getvalue()


def maybe_downscale(
    image_bytes: bytes, max_pixels: int, image_format: str
) -> tuple[bytes, bool]:
    """Downscale an image if it exceeds the pixel budget.

    Uses Lanczos resampling, preserves format. JPEG quality is set to 85.

    Args:
        image_bytes: Raw image bytes.
        max_pixels: Maximum allowed total pixels (width * height).
        image_format: Uppercase format string.

    Returns:
        Tuple of (possibly resized bytes, whether downscaling occurred).
    """
    img = Image.open(io.BytesIO(image_bytes))
    width, height = img.size
    total_pixels = width * height

    if total_pixels <= max_pixels:
        return image_bytes, False

    scale = math.sqrt(max_pixels / total_pixels)
    new_width = int(width * scale)
    new_height = int(height * scale)

    logger.info(
        "Downscaling from %dx%d to %dx%d", width, height, new_width, new_height
    )
    img = img.resize((new_width, new_height), Image.LANCZOS)

    buf = io.BytesIO()
    save_kwargs: dict = {}
    if image_format == "JPEG":
        save_kwargs["quality"] = 85
    img.save(buf, format=image_format, **save_kwargs)
    return buf.getvalue(), True
