"""Integration tests for the StripMyPix API endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_analyze_valid_jpeg(client: AsyncClient, jpeg_with_exif: bytes) -> None:
    """POST /analyze with a valid JPEG returns 200 and matching schema."""
    response = await client.post(
        "/analyze",
        files={"file": ("test.jpg", jpeg_with_exif, "image/jpeg")},
    )
    assert response.status_code == 200

    data = response.json()
    assert "risk_score" in data
    assert "findings" in data
    assert isinstance(data["findings"], list)
    assert data["filename"] == "test.jpg"
    assert isinstance(data["risk_score"], int)
    assert 0 <= data["risk_score"] <= 100


@pytest.mark.anyio
async def test_analyze_unsupported_type(client: AsyncClient) -> None:
    """POST /analyze with a non-image file returns 415."""
    response = await client.post(
        "/analyze",
        files={"file": ("test.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 415
    data = response.json()
    assert data["detail"]["code"] == "UNSUPPORTED_TYPE"


@pytest.mark.anyio
async def test_analyze_too_large(
    client: AsyncClient, app, jpeg_clean: bytes
) -> None:
    """POST /analyze with an oversized file returns 413."""
    from app.config import Settings, get_settings

    tiny_settings = Settings(max_upload_bytes=10)
    app.dependency_overrides[get_settings] = lambda: tiny_settings

    try:
        response = await client.post(
            "/analyze",
            files={"file": ("big.jpg", jpeg_clean, "image/jpeg")},
        )
        assert response.status_code == 413
        data = response.json()
        assert data["detail"]["code"] == "FILE_TOO_LARGE"
    finally:
        app.dependency_overrides.pop(get_settings, None)


@pytest.mark.anyio
async def test_strip_returns_image(client: AsyncClient, jpeg_with_exif: bytes) -> None:
    """POST /strip returns 200 with an image content type."""
    response = await client.post(
        "/strip",
        files={"file": ("photo.jpg", jpeg_with_exif, "image/jpeg")},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/")
    assert len(response.content) > 0
