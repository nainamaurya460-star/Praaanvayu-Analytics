from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from services.air_quality import fetch_air_quality
from services.tree_calculator import calculate_tree_deficit
from services.cv_engine import analyze_canopy_image

app = FastAPI(
    title="PraanVayu Analytics Engine",
    description="Precision Urban Forestry & Micro-Climate Intelligence API",
    version="1.0.0"
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

class AnalyzeZoneRequest(BaseModel):
class ZoneRequest(BaseModel):
    lat_min: float
    lat_max: float
    lng_min: float
    lng_max: float
    total_area_sqm: Optional[float] = 50000.0
    plantable_area_sqm: Optional[float] = 12500.0
    current_canopy_percent: Optional[float] = 14.2

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PraanVayu Analytics Core",
        "version": "1.0.0"
    }

@app.post("/api/analyze-zone")
async def analyze_zone(payload: AnalyzeZoneRequest):
    try:
        center_lat = (payload.lat_min + payload.lat_max) / 2.0
        center_lng = (payload.lng_min + payload.lng_max) / 2.0

        telemetry = await fetch_air_quality(lat=center_lat, lon=center_lng)

        deficit_results = calculate_tree_deficit(
            total_area_sqm=payload.total_area_sqm,
            plantable_area_sqm=payload.plantable_area_sqm,
            current_canopy_percent=payload.current_canopy_percent,
            aqi=telemetry.get("aqi", 150)
        )

        return {
            "success": True,
            "center_coordinates": {"lat": center_lat, "lng": center_lng},
            "telemetry": telemetry,
            "canopy_analysis": deficit_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@app.post("/api/analyze-canopy-upload")
async def analyze_canopy_upload(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        cv_result = analyze_canopy_image(image_bytes)
        return {
            "success": True,
            "filename": file.filename,
            "result": cv_result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
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
