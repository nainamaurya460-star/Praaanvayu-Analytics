from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from services.air_quality import fetch_real_air_telemetry
from services.satellite_cv import download_and_analyze_satellite_frame, analyze_custom_polygon_satellite
from services.tree_recommender import calculate_afforestation_plan

app = FastAPI(
    title="PraanVayu AI Analytics Engine",
    description="Real-time Satellite Computer Vision & Urban Climate Intelligence API",
    version="3.2.0"
)

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    lat_min: Optional[float] = 26.9457
    lat_max: Optional[float] = 26.9617
    lng_min: Optional[float] = 75.8383
    lng_max: Optional[float] = 75.8543
    polygon: Optional[List[List[float]]] = None

@app.get("/")
def read_root():
    return {
        "status": "ready",
        "message": "PraanVayu AI Analytics Engine is Live",
        "docs": "http://localhost:8000/docs"
    }

@app.post("/api/analyze-zone")
def analyze_zone(req: AnalyzeRequest):
    # 1. Check if user provided a Freehand Polygon or a Bounding Box
    if req.polygon and len(req.polygon) >= 3:
        veg_data = analyze_custom_polygon_satellite(req.polygon)
        lats = [p[0] for p in req.polygon]
        lngs = [p[1] for p in req.polygon]
        center_lat = sum(lats) / len(lats)
        center_lng = sum(lngs) / len(lngs)
    else:
        lat_min = req.lat_min or 26.9457
        lat_max = req.lat_max or 26.9617
        lng_min = req.lng_min or 75.8383
        lng_max = req.lng_max or 75.8543
        center_lat = (lat_min + lat_max) / 2.0
        center_lng = (lng_min + lng_max) / 2.0
        veg_data = download_and_analyze_satellite_frame(lat_min, lat_max, lng_min, lng_max)

    # 2. Fetch live atmospheric sensor metrics for the center coordinates
    telemetry = fetch_real_air_telemetry(center_lat, center_lng)

    # 3. Calculate target plantation, species allocation & municipal budget
    action_plan = calculate_afforestation_plan(veg_data["plantable_area_m2"], telemetry["aqi"])

    return {
        "status": "success",
        "location_name": telemetry["location_name"],
        "coordinates": {"lat": center_lat, "lng": center_lng},
        "telemetry": telemetry,
        "vegetation": veg_data,
        "action_plan": action_plan
    }