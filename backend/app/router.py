# app/router.py
import networkx as nx
from typing import Optional


class NavigationResult:
    def __init__(self, path_keys: list, coords: list[dict],
                 total_distance_m: float, node_names: list[str]):
        self.path_keys = path_keys
        self.coords = coords                    # [{lat, lon}, ...] for Leaflet
        self.total_distance_m = total_distance_m
        self.node_names = node_names            # named waypoints only


def find_path(
    G: nx.Graph,
    name_to_key: dict,
    start_name: str,
    end_name: str
) -> NavigationResult:
    """
    Resolve location names → node keys → run Dijkstra → return NavigationResult.
    Raises ValueError for unknown locations or disconnected graph sections.
    """
    start_key = _resolve(start_name, name_to_key)
    end_key   = _resolve(end_name,   name_to_key)

    if start_key == end_key:
        raise ValueError("Start and destination are the same location.")

    if not nx.has_path(G, start_key, end_key):
        raise ValueError(
            f"No connected path found between '{start_name}' and '{end_name}'. "
            "Check that both nodes are in the same graph component."
        )

    try:
        path_keys = nx.shortest_path(G, start_key, end_key, weight="weight")
    except nx.NetworkXNoPath:
        raise ValueError(f"Dijkstra could not find a path: {start_name} → {end_name}")

    # Build output
    total_dist = 0.0
    coords = []
    node_names = []

    for i, key in enumerate(path_keys):
        node_data = G.nodes[key]
        coords.append({"lat": key[1], "lon": key[0]})

        name = node_data.get("name")
        if name:
            node_names.append(name)

        if i > 0:
            total_dist += G[path_keys[i - 1]][key]["weight"]

    return NavigationResult(
        path_keys=path_keys,
        coords=coords,
        total_distance_m=round(total_dist, 1),
        node_names=node_names
    )


def _resolve(name: str, name_to_key: dict) -> tuple:
    """Case-insensitive location name lookup."""
    key = name_to_key.get(name.strip().lower())
    if key is None:
        # Fuzzy fallback: partial match
        name_lower = name.strip().lower()
        for stored_name, stored_key in name_to_key.items():
            if name_lower in stored_name or stored_name in name_lower:
                return stored_key
        raise ValueError(
            f"Location '{name}' not found in campus map. "
            f"Available examples: {list(name_to_key.keys())[:5]}"
        )
    return key
