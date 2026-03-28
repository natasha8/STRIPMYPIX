"""Pydantic response models for the StripMyPix API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class GpsCoord(BaseModel):
    """Geographic coordinates extracted from EXIF GPS data."""

    lat: float = Field(description="Latitude in decimal degrees")
    lng: float = Field(description="Longitude in decimal degrees")


class Finding(BaseModel):
    """A single metadata finding with its assessed risk level."""

    category: str = Field(description="Metadata category (e.g. GPS, Camera Model)")
    value: str = Field(description="Extracted value")
    risk: Literal["critical", "high", "medium", "low"] = Field(
        description="Privacy risk level"
    )


class AnalysisResponse(BaseModel):
    """Full analysis result returned by POST /analyze."""

    risk_score: int = Field(ge=0, le=100, description="Privacy score 0-100")
    findings: list[Finding] = Field(default_factory=list)
    gps: GpsCoord | None = Field(default=None, description="GPS coords if found")
    filename: str = Field(description="Original uploaded filename")
    downscaled: bool = Field(
        default=False, description="Whether the image was downscaled"
    )
