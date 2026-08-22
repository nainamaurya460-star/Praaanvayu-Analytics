import math

SPECIES_CATALOGUE = [
    {
        "name": "Neem (Azadirachta indica)",
        "scientific_name": "Azadirachta indica",
        "tag": "Max PM2.5 Absorption",
        "weight": 0.40,
        "pm_absorption_rate": "Very High (18.2 kg/yr)",
        "survival_rate": "94%"
    },
    {
        "name": "Peepal (Ficus religiosa)",
        "scientific_name": "Ficus religiosa",
        "tag": "High O2 & Micro-Cooling",
        "weight": 0.30,
        "pm_absorption_rate": "High (15.6 kg/yr)",
        "survival_rate": "96%"
    },
    {
        "name": "Karanj (Pongamia pinnata)",
        "scientific_name": "Pongamia pinnata",
        "tag": "Drought & Gas Resilient",
        "weight": 0.30,
        "pm_absorption_rate": "High (14.1 kg/yr)",
        "survival_rate": "90%"
    }
]

def calculate_tree_deficit(total_area_sqm: float, plantable_area_sqm: float, current_canopy_percent: float, aqi: float) -> dict:
    """
    Calculates exact sapling deficit to achieve 33% target canopy coverage.
    Standard mature crown footprint ~ 14 m² per sapling.
    """
    TARGET_CANOPY_PERCENT = 33.0
    CANOPY_FOOTPRINT_PER_TREE = 14.0  # m²

    deficit_percent = max(0.0, TARGET_CANOPY_PERCENT - current_canopy_percent)
    deficit_area_sqm = (deficit_percent / 100.0) * total_area_sqm
    effective_plantation_area = min(deficit_area_sqm, plantable_area_sqm)
    exact_trees_needed = math.ceil(effective_plantation_area / CANOPY_FOOTPRINT_PER_TREE) if effective_plantation_area > 0 else 0

    recommended_species = []
    for sp in SPECIES_CATALOGUE:
        count = math.floor(exact_trees_needed * sp["weight"])
        recommended_species.append({
            "name": sp["name"],
            "tag": sp["tag"],
            "allocation_count": count,
            "survival_rate": sp["survival_rate"],
            "pm_sink_metric": sp["pm_absorption_rate"]
        })

    # Adjust rounding differences into primary species (Neem)
    allocated_sum = sum(s["allocation_count"] for s in recommended_species)
    if exact_trees_needed > allocated_sum and len(recommended_species) > 0:
        recommended_species[0]["allocation_count"] += (exact_trees_needed - allocated_sum)

    return {
        "benchmark_canopy_percent": TARGET_CANOPY_PERCENT,
        "current_canopy_percent": round(current_canopy_percent, 2),
        "deficit_percent": round(deficit_percent, 2),
        "plantable_area_sqm": round(plantable_area_sqm, 2),
        "exact_trees_needed": exact_trees_needed,
        "recommended_species": recommended_species
    }