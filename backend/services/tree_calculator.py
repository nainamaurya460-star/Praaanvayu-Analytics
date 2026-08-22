from typing import Dict, Any, List

SPECIES_CATALOG = [
    {
        "name": "Peepal (Ficus religiosa)",
        "scientific": "Ficus religiosa",
        "image": "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80",
        "oxygen_kg_year": 2400,
        "co2_sink_kg_year": 1200,
        "cost_per_sapling_inr": 140,
        "badge": "24/7 Oxygen Producer (CAM)",
        "suitability": "Ideal for broad avenues, urban plazas, and lake perimeters"
    },
    {
        "name": "Khejri (Prosopis cineraria)",
        "scientific": "Prosopis cineraria",
        "image": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
        "oxygen_kg_year": 1650,
        "co2_sink_kg_year": 900,
        "cost_per_sapling_inr": 110,
        "badge": "State Tree of Rajasthan",
        "suitability": "Thrives in dry, semi-arid terrain like Kukas with zero irrigation"
    },
    {
        "name": "Neem (Azadirachta indica)",
        "scientific": "Azadirachta indica",
        "image": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
        "oxygen_kg_year": 1850,
        "co2_sink_kg_year": 950,
        "cost_per_sapling_inr": 125,
        "badge": "Natural Bio-Filter",
        "suitability": "Dense dust & PM2.5 trapping near industrial highways"
    },
    {
        "name": "Arjun (Terminalia arjuna)",
        "scientific": "Terminalia arjuna",
        "image": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
        "oxygen_kg_year": 1950,
        "co2_sink_kg_year": 1100,
        "cost_per_sapling_inr": 130,
        "badge": "Riparian Specialist",
        "suitability": "Recommended along Man Sagar Lake & river drainage corridors"
    }
]

def calculate_afforestation_plan(
    total_area_m2: float,
    current_canopy_pct: float,
    plantable_area_m2: float,
    aqi: int,
    pm25: float
) -> Dict[str, Any]:
    # 1. Deficit Math
    target_canopy_pct = 33.0
    deficit_pct = max(0.0, target_canopy_pct - current_canopy_pct)
    max_tree_capacity = int(plantable_area_m2 / 15.0)
    
    multiplier = 1.0 if aqi > 250 else (0.85 if aqi > 150 else 0.65)
    trees_needed = max(10, min(max_tree_capacity, int(max_tree_capacity * multiplier)))

    # 2. Ecological Projections
    total_oxygen_yield_kg = trees_needed * 1950
    total_co2_offset_tons = round((trees_needed * 1.05), 1)
    pollution_drop_pct = min(45, max(12, int(deficit_pct * 1.35 + (trees_needed / 25.0))))

    # 3. Municipal Budget Estimations (Forest Dept Benchmarks)
    avg_sapling_cost = 125  # INR
    tree_guard_cost = 320   # INR (Metal/Bamboo protection)
    labor_digging_cost = 150 # INR
    maintenance_1yr = 180   # INR (Watering & mulching)
    cost_per_unit = avg_sapling_cost + tree_guard_cost + labor_digging_cost + maintenance_1yr # ₹775

    total_estimated_budget_inr = int(trees_needed * cost_per_unit)

    budget_breakdown = {
        "cost_per_tree_inr": cost_per_unit,
        "total_budget_inr": total_estimated_budget_inr,
        "total_budget_lakhs": round(total_estimated_budget_inr / 100000.0, 2),
        "saplings_procurement_inr": int(trees_needed * avg_sapling_cost),
        "guards_and_infrastructure_inr": int(trees_needed * tree_guard_cost),
        "labor_and_plantation_inr": int(trees_needed * labor_digging_cost),
        "maintenance_first_year_inr": int(trees_needed * maintenance_1yr),
        "estimated_completion_days": max(7, int(trees_needed / 45))
    }

    return {
        "target_canopy_pct": target_canopy_pct,
        "target_deficit_pct": round(deficit_pct, 1),
        "trees_needed": trees_needed,
        "total_oxygen_yield_kg_per_year": total_oxygen_yield_kg,
        "total_co2_offset_tons": total_co2_offset_tons,
        "pollution_drop_pct": pollution_drop_pct,
        "budget_breakdown": budget_breakdown,
        "recommended_species": SPECIES_CATALOG
    }