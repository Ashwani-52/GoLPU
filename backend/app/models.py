# app/models.py
from pydantic import BaseModel, Field
from typing import Optional


class NavigateRequest(BaseModel):
    start: str = Field(..., example="Block 18")
    end:   str = Field(..., example="Block 25")
    mode:  str = Field(default="walking", pattern="^(walking|golfcart|auto)$")

    class Config:
        json_schema_extra = {
            "example": {
                "start": "Unipolis",
                "end": "Block 32",
                "mode": "auto"
            }
        }


class Coordinate(BaseModel):
    lat: float
    lon: float


class NavigateResponse(BaseModel):
    start: str
    end: str
    total_distance_m: float
    estimated_walk_minutes: float
    mode_suggested: str
    waypoints: list[str]          # named nodes along the path
    coordinates: list[Coordinate] # full polyline for Leaflet
    ai_directions: str            # Gemini-formatted human text
    raw_path_available: bool = True
