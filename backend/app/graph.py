# app/graph.py
import json
import math
import networkx as nx
from pathlib import Path
from typing import Optional

# ── Tuning constant ────────────────────────────────────────────────────────────
# Any GeoJSON Point within this many degrees of an edge endpoint is considered
# the "same" node. Tune this if your GeoJSON is very precise (lower) or loose (higher).
SNAP_TOLERANCE = 0.0003   # roughly ~30 metres at LPU's latitude


# ── Helpers ────────────────────────────────────────────────────────────────────

def _coord_key(lon: float, lat: float) -> tuple:
    """Round coordinates to 6 decimal places to use as a stable dict key."""
    return (round(lon, 6), round(lat, 6))


def _euclidean_dist(c1: tuple, c2: tuple) -> float:
    """
    Approximate distance between two (lon, lat) pairs using Pythagoras.
    Good enough for a campus-scale graph — no projection needed.
    Multiply by 111_320 to convert degrees → metres (approx).
    """
    return math.dist(c1, c2) * 111_320   # metres


def _snap(coord: tuple, node_lookup: dict) -> Optional[tuple]:
    """
    Find the named node closest to `coord` within SNAP_TOLERANCE.
    Returns the node's canonical key, or None if nothing is close enough.
    """
    best_key, best_dist = None, float("inf")
    for key in node_lookup:
        d = math.dist(coord, key)
        if d < best_dist:
            best_dist = d
            best_key = key
    return best_key if best_dist <= SNAP_TOLERANCE else None


# ── Main loader ────────────────────────────────────────────────────────────────

def build_graph(geojson_path: str) -> tuple[nx.Graph, dict]:
    """
    Parse a GeoJSON file and return:
      - G            : undirected weighted NetworkX graph
      - name_to_key  : dict mapping location name → (lon, lat) node key
    """
    path = Path(geojson_path)
    if not path.exists():
        raise FileNotFoundError(f"GeoJSON not found at: {geojson_path}")

    with open(path, encoding="utf-8") as f:
        geojson = json.load(f)

    features = geojson.get("features", [])

    G = nx.Graph()
    name_to_key: dict[str, tuple] = {}      # "Block 18" → (lon, lat)
    node_lookup:  dict[tuple, str] = {}      # (lon, lat) → "Block 18"

    # ── Pass 1: Register all Point features as named nodes ────────────────────
    for feat in features:
        geom = feat.get("geometry", {})
        props = feat.get("properties") or {}

        if geom.get("type") != "Point":
            continue

        lon, lat = geom["coordinates"][:2]
        key = _coord_key(lon, lat)

        # Accept any of these property keys as the node's display name
        name = (
            props.get("name")
            or props.get("Name")
            or props.get("title")
            or props.get("label")
            or f"node_{key}"
        )

        # Store node in graph with metadata
        G.add_node(key, name=name, lon=lon, lat=lat)
        name_to_key[name.strip().lower()] = key
        node_lookup[key] = name

    print(f"[Graph] ✅ Loaded {G.number_of_nodes()} named nodes")

    # ── Pass 2: Register all LineString features as edges ─────────────────────
    edge_count = 0
    orphan_count = 0

    for feat in features:
        geom = feat.get("geometry", {})
        props = feat.get("properties") or {}

        if geom.get("type") != "LineString":
            continue

        coords = geom["coordinates"]
        if len(coords) < 2:
            continue

        # Determine edge type from properties (for future golfcart logic)
        edge_type = props.get("type", "walking")   # "walking" | "golfcart" | "both"

        # Walk every consecutive pair of coordinates along the polyline.
        # If an intermediate vertex isn't a named node, we add it as an
        # anonymous graph node so the path stays geometrically accurate.
        for i in range(len(coords) - 1):
            c_from = _coord_key(*coords[i][:2])
            c_to   = _coord_key(*coords[i + 1][:2])

            # Snap to nearest named node if close enough
            snapped_from = _snap(c_from, node_lookup) or c_from
            snapped_to   = _snap(c_to,   node_lookup) or c_to

            # Add anonymous intermediate nodes if they don't exist yet
            for c in (snapped_from, snapped_to):
                if c not in G:
                    G.add_node(c, name=None, lon=c[0], lat=c[1])

            weight = _euclidean_dist(snapped_from, snapped_to)

            if weight < 0.1:          # skip degenerate zero-length edges
                continue

            G.add_edge(
                snapped_from,
                snapped_to,
                weight=weight,
                type=edge_type
            )
            edge_count += 1

    print(f"[Graph] ✅ Built {edge_count} edges  |  {orphan_count} orphan coords promoted to nodes")
    print(f"[Graph] 🗺️  Graph has {G.number_of_nodes()} total nodes, {G.number_of_edges()} edges")

    return G, name_to_key
