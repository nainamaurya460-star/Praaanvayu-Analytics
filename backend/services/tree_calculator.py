import json
import os
from typing import Dict, Any

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "native_trees.json")

def calculate_tree_plan(plantable_area_m2: float, canopy_pct: float, aqi: int) -> Dict[str, Any]:
    target_cover = 33.0
    deficit_pct = max(0.0, target_cover - canopy_pct)
    
    tree_unit_area = 14.0
    raw_tree_capacity = plantable_area_m2 / tree_unit_area
    trees_needed = int(round(raw_tree_capacity * (deficit_pct / target_cover))) if deficit_pct > 0 else 0
    trees_needed = max(trees_needed, 5) if plantable_area_m2 > 100 else 0

    try:
        with open(DATA_PATH, "r") as f:
            species_list = json.load(f)
    except Exception:
        species_list = [
            {"name": "Neem (Azadirachta indica)", "pm_sink_score": "Very High"},
            {"name": "Peepal (Ficus religiosa)", "pm_sink_score": "High"}
        ]

    if aqi > 200:
        species_list = sorted(species_list, key=lambda x: 0 if x.get("pm_sink_score") == "Very High" else 1)

    return {
        "target_deficit_pct": round(deficit_pct, 2),
        "trees_needed": trees_needed,
        "recommended_species": species_list[:3]
    }