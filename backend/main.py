from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.satellite_cv import (
    download_and_analyze_satellite_frame, 
    analyze_custom_polygon_satellite
)
from services.air_quality import fetch_real_air_telemetry
from services.tree_calculator import calculate_afforestation_plan
from services.cv_engine import analyze_canopy_image

app = FastAPI(
    title="PraanVayu Real-Time AI Analytics Engine",
    version="3.1.0",
    description="Genuine live satellite CV canopy detection & real-time atmospheric telemetry system"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ZoneRequest(BaseModel):
    lat_min: Optional[float] = None
    lat_max: Optional[float] = None
    lng_min: Optional[float] = None
    lng_max: Optional[float] = None
    polygon: Optional[List[List[float]]] = None

@app.get("/")
def root():
    return {
        "message": "PraanVayu AI Analytics Engine is Live",
        "docs": "http://127.0.0.1:8000/docs",
        "status": "ready"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "PraanVayu Real Satellite CV & Open-Meteo Sensor Pipeline",
        "version": "3.1.0"
    }

@app.post("/api/analyze-zone")
def analyze_zone(req: ZoneRequest):
    try:
        if req.polygon and len(req.polygon) >= 3:
            lats = [p[0] for p in req.polygon]
            lngs = [p[1] for p in req.polygon]
            center_lat = sum(lats) / len(lats)
            center_lng = sum(lngs) / len(lngs)
            
            veg_stats = analyze_custom_polygon_satellite(req.polygon)
            bounds_meta = req.polygon
        else:
            if None in (req.lat_min, req.lat_max, req.lng_min, req.lng_max):
                raise HTTPException(status_code=400, detail="Invalid coordinates provided.")

            center_lat = (req.lat_min + req.lat_max) / 2.0
            center_lng = (req.lng_min + req.lng_max) / 2.0

            veg_stats = download_and_analyze_satellite_frame(
                req.lat_min, req.lat_max, req.lng_min, req.lng_max
            )
            bounds_meta = [[req.lat_min, req.lng_min], [req.lat_max, req.lng_max]]

        telemetry = fetch_real_air_telemetry(center_lat, center_lng)
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
                "center": [round(center_lat, 5), round(center_lng, 5)],
                "bounds": bounds_meta
            },
            "telemetry": telemetry,
            "vegetation": veg_stats,
            "action_plan": plan
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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