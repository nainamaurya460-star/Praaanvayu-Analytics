from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.satellite_cv import download_and_analyze_satellite_frame
from services.air_quality import fetch_real_air_telemetry
from services.tree_calculator import calculate_afforestation_plan

app = FastAPI(
    title="PraanVayu Real-Time AI Analytics Engine",
    version="3.0.0",
    description="Genuine live satellite CV canopy detection & real-time atmospheric telemetry system"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ZoneRequest(BaseModel):
    lat_min: float
    lat_max: float
    lng_min: float
    lng_max: float

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "engine": "PraanVayu Real Satellite CV & Open-Meteo Sensor Pipeline",
        "version": "3.0.0"
    }

@app.post("/api/analyze-zone")
def analyze_zone(req: ZoneRequest):
    center_lat = (req.lat_min + req.lat_max) / 2.0
    center_lng = (req.lng_min + req.lng_max) / 2.0

    # 1. Real Computer Vision on Live ArcGIS Satellite Tiles
    veg_stats = download_and_analyze_satellite_frame(
        req.lat_min, req.lat_max, req.lng_min, req.lng_max
    )

    # 2. Real Live Telemetry & Weather from Sensor Networks
    telemetry = fetch_real_air_telemetry(center_lat, center_lng)

    # 3. Scientific Deficit & Native Afforestation Engine
    plan = calculate_afforestation_plan(
        total_area_m2=veg_stats["total_area_m2"],
        current_canopy_pct=veg_stats["canopy_pct"],
        plantable_area_m2=veg_stats["plantable_area_m2"],
        aqi=telemetry["aqi"],
        pm25=telemetry["pm25"]
    )

    return {
        "status": "success",
        "location_name": telemetry["location_name"],
        "coordinates": {
            "center": [center_lat, center_lng],
            "bounds": [[req.lat_min, req.lng_min], [req.lat_max, req.lng_max]]
        },
        "telemetry": telemetry,
        "vegetation": veg_stats,
        "action_plan": plan
    }