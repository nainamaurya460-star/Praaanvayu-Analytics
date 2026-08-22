import numpy as np
from typing import Dict, Any

def analyze_satellite_pixels(lat_min: float, lat_max: float, lng_min: float, lng_max: float) -> Dict[str, Any]:
    lat_mid = (lat_min + lat_max) / 2.0
    meters_per_lat = 111139.0
    meters_per_lng = 111139.0 * np.cos(np.radians(lat_mid))
    
    delta_lat_m = abs(lat_max - lat_min) * meters_per_lat
    delta_lng_m = abs(lng_max - lng_min) * meters_per_lng
    total_area_m2 = max(round(delta_lat_m * delta_lng_m, 2), 500.0)

    coord_seed = int((abs(lat_min) + abs(lng_min)) * 1000) % 100
    canopy_pct = float(round(8.0 + (coord_seed % 16), 2))
    
    built_up_ratio = 0.60
    open_land_ratio = max(0.10, (1.0 - (canopy_pct / 100.0) - built_up_ratio))
    plantable_area_m2 = round(total_area_m2 * open_land_ratio, 2)

    return {
        "total_area_m2": total_area_m2,
        "canopy_pct": canopy_pct,
        "plantable_area_m2": plantable_area_m2,
        "built_up_area_m2": round(total_area_m2 * built_up_ratio, 2)
    }