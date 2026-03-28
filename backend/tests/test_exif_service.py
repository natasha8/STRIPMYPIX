"""Unit tests for the EXIF extraction and processing service."""

from __future__ import annotations

import pytest

from app.services.exif import (
    extract_metadata,
    calculate_risk_score,
    strip_metadata,
    maybe_downscale,
)


class TestExtractMetadata:
    """Tests for extract_metadata()."""

    def test_extract_metadata_with_gps(self, jpeg_with_exif: bytes) -> None:
        """GPS finding should be critical with correct coordinates."""
        result = extract_metadata(jpeg_with_exif)

        gps_findings = [f for f in result.findings if f.category == "GPS Location"]
        assert len(gps_findings) == 1
        assert gps_findings[0].risk == "critical"

        assert result.gps is not None
        assert abs(result.gps.lat - 40.7128) < 0.001
        assert abs(result.gps.lng - (-74.006)) < 0.001

    def test_extract_metadata_clean(self, jpeg_clean: bytes) -> None:
        """Clean JPEG should yield no findings."""
        result = extract_metadata(jpeg_clean)
        assert result.findings == []
        assert result.gps is None


class TestRiskScore:
    """Tests for calculate_risk_score()."""

    def test_risk_score_gps_and_serial(self, jpeg_with_gps_and_serial: bytes) -> None:
        """GPS (-50) + Serial (-20) = score 30."""
        result = extract_metadata(jpeg_with_gps_and_serial)
        score = calculate_risk_score(result.findings)
        assert score == 30

    def test_risk_score_clean(self, jpeg_clean: bytes) -> None:
        """No findings should give a perfect 100."""
        result = extract_metadata(jpeg_clean)
        score = calculate_risk_score(result.findings)
        assert score == 100


class TestStripMetadata:
    """Tests for strip_metadata()."""

    def test_strip_removes_exif(self, jpeg_with_exif: bytes) -> None:
        """Stripping then re-extracting should yield no findings."""
        clean = strip_metadata(jpeg_with_exif, "JPEG")
        result = extract_metadata(clean)
        assert result.findings == []
        assert result.gps is None


class TestMaybeDownscale:
    """Tests for maybe_downscale()."""

    def test_maybe_downscale_small_image(self, jpeg_clean: bytes) -> None:
        """A 100x100 image (10k pixels) should not be downscaled."""
        result_bytes, downscaled = maybe_downscale(jpeg_clean, 24_000_000, "JPEG")
        assert not downscaled
        assert result_bytes == jpeg_clean
