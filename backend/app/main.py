# app/main.py
import os
import math
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .graph import build_graph
from .router import find_path
from .ai import format_directions
from .models import NavigateRequest, NavigateResponse, Coordinate

load_dotenv()

# ── State shared across requests ───────────────────────────────────────────────
_state: dict = {}

GEOJSON_PATH = Path(__file__).parent.parent / "data" / "map.geojson"


# ── Lifespan: load graph once at startup ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Startup] Loading campus graph from GeoJSON...")
    try:
        G, name_to_key = build_graph(str(GEOJSON_PATH))
        _state["G"] = G
        _state["name_to_key"] = name_to_key
        print(f"[Startup] ✅ Graph ready — {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    except Exception as e:
        print(f"[Startup] ❌ Failed to load graph: {e}")
        raise

    yield   # ← app runs here

    print("[Shutdown] Clearing graph state...")
    _state.clear()


# ── App instance ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="LPU Campus Navigation API",
    description="Hyper-local campus routing powered by NetworkX + Gemini AI",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
async def health():
    G = _state.get("G")
    return {
        "status": "online",
        "graph_nodes": G.number_of_nodes() if G else 0,
        "graph_edges": G.number_of_edges() if G else 0,
        "message": "LPU Campus Navigation API is running 🎓"
    }


@app.post("/api/navigate", response_model=NavigateResponse)
async def navigate(req: NavigateRequest):
    G = _state.get("G")
    name_to_key = _state.get("name_to_key")

    if G is None:
        raise HTTPException(status_code=503, detail="Graph not loaded yet. Try again shortly.")

    # ── Step 1: Dijkstra routing ───────────────────────────────────────────────
    try:
        result = find_path(G, name_to_key, req.start, req.end)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # ── Step 2: Determine travel mode suggestion ───────────────────────────────
    if req.mode == "auto":
        mode_suggested = "golfcart" if result.total_distance_m > 800 else "walking"
    else:
        mode_suggested = req.mode

    # ── Step 3: AI direction formatting ───────────────────────────────────────
    ai_text = format_directions(
        start=req.start,
        end=req.end,
        waypoints=result.node_names,
        distance_m=result.total_distance_m,
        mode=mode_suggested
    )

    walk_minutes = round(result.total_distance_m / 80, 1)

    return NavigateResponse(
        start=req.start,
        end=req.end,
        total_distance_m=result.total_distance_m,
        estimated_walk_minutes=walk_minutes,
        mode_suggested=mode_suggested,
        waypoints=result.node_names,
        coordinates=[Coordinate(**c) for c in result.coords],
        ai_directions=ai_text
    )


@app.get("/api/locations")
async def list_locations():
    """Returns all named locations in the campus graph — useful for frontend autocomplete."""
    name_to_key = _state.get("name_to_key", {})
    return {
        "count": len(name_to_key),
        "locations": sorted(name_to_key.keys())
    }
