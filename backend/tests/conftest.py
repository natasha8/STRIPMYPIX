"""Shared fixtures for backend tests.

Generates JPEG images programmatically with and without EXIF data
using Pillow and piexif.
"""

from __future__ import annotations

import io
from typing import AsyncGenerator

import piexif
import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image

from app.main import create_app


@pytest.fixture
def app():
    """Create a fresh FastAPI application for testing."""
    return create_app()


@pytest.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP test client wired to the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def _build_exif_bytes(
    *,
    gps: bool = False,
    camera_model: str | None = None,
    timestamp: str | None = None,
    serial: str | None = None,
) -> bytes:
    """Build piexif-compatible EXIF byte payload.

    Args:
        gps: Whether to include GPS coordinates (40.7128 N, 74.0060 W).
        camera_model: Camera model string to embed.
        timestamp: DateTimeOriginal string to embed.
        serial: Body serial number to embed.

    Returns:
        EXIF bytes ready for piexif.insert().
    """
    zeroth_ifd: dict = {}
    exif_ifd: dict = {}
    gps_ifd: dict = {}

    if camera_model:
        zeroth_ifd[piexif.ImageIFD.Model] = camera_model.encode()

    if timestamp:
        exif_ifd[piexif.ExifIFD.DateTimeOriginal] = timestamp.encode()

    if serial:
        exif_ifd[piexif.ExifIFD.BodySerialNumber] = serial.encode()

    if gps:
        gps_ifd[piexif.GPSIFD.GPSLatitudeRef] = b"N"
        gps_ifd[piexif.GPSIFD.GPSLatitude] = (
            (40, 1),
            (42, 1),
            (4608, 100),
        )
        gps_ifd[piexif.GPSIFD.GPSLongitudeRef] = b"W"
        gps_ifd[piexif.GPSIFD.GPSLongitude] = (
            (74, 1),
            (0, 1),
            (2160, 100),
        )

    exif_dict = {"0th": zeroth_ifd, "Exif": exif_ifd, "GPS": gps_ifd, "1st": {}}
    return piexif.dump(exif_dict)


def _make_jpeg(width: int = 100, height: int = 100, exif: bytes | None = None) -> bytes:
    """Create a minimal JPEG image in memory.

    Args:
        width: Image width in pixels.
        height: Image height in pixels.
        exif: Optional EXIF bytes to embed.

    Returns:
        JPEG file bytes.
    """
    img = Image.new("RGB", (width, height), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    jpeg_bytes = buf.getvalue()

    if exif:
        output = io.BytesIO()
        piexif.insert(exif, jpeg_bytes, output)
        jpeg_bytes = output.getvalue()

    return jpeg_bytes


@pytest.fixture
def jpeg_with_exif() -> bytes:
    """A 100x100 red JPEG with GPS, camera model, timestamp, and serial."""
    exif = _build_exif_bytes(
        gps=True,
        camera_model="TestCam X100",
        timestamp="2024:06:15 14:30:00",
        serial="SN12345678",
    )
    return _make_jpeg(exif=exif)


@pytest.fixture
def jpeg_clean() -> bytes:
    """A 100x100 red JPEG with no EXIF data."""
    return _make_jpeg()


@pytest.fixture
def jpeg_with_gps_and_serial() -> bytes:
    """A JPEG with only GPS and serial number (no camera/timestamp)."""
    exif = _build_exif_bytes(gps=True, serial="SN99999999")
    return _make_jpeg(exif=exif)
