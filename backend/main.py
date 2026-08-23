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

# Optional CV Upload service fallback if available
try:
    from services.cv_engine import analyze_canopy_image
except ImportError:
    analyze_canopy_image = None

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

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "PraanVayu Real Satellite CV & Open-Meteo Sensor Pipeline",
        "version": "3.2.0"
    }

@app.post("/api/analyze-zone")
def analyze_zone(req: AnalyzeRequest):
    try:
        # 1. Check if user provided a Freehand Polygon or a Bounding Box
        if req.polygon and len(req.polygon) >= 3:
            veg_data = analyze_custom_polygon_satellite(req.polygon)
            lats = [p[0] for p in req.polygon]
            lngs = [p[1] for p in req.polygon]
            center_lat = sum(lats) / len(lats)
            center_lng = sum(lngs) / len(lngs)
            bounds_meta = req.polygon
        else:
            lat_min = req.lat_min if req.lat_min is not None else 26.9457
            lat_max = req.lat_max if req.lat_max is not None else 26.9617
            lng_min = req.lng_min if req.lng_min is not None else 75.8383
            lng_max = req.lng_max if req.lng_max is not None else 75.8543
            center_lat = (lat_min + lat_max) / 2.0
            center_lng = (lng_min + lng_max) / 2.0
            
            veg_data = download_and_analyze_satellite_frame(lat_min, lat_max, lng_min, lng_max)
            bounds_meta = [[lat_min, lng_min], [lat_max, lng_max]]

        # 2. Fetch live atmospheric sensor metrics for coordinates
        telemetry = fetch_real_air_telemetry(center_lat, center_lng)

        # 3. Calculate target plantation & budget matrix
        try:
            action_plan = calculate_afforestation_plan(
                total_area_m2=veg_data.get("total_area_m2", 250000),
                current_canopy_pct=veg_data.get("canopy_pct", 18.5),
                plantable_area_m2=veg_data.get("plantable_area_m2", 120000),
                aqi=telemetry.get("aqi", 150),
                pm25=telemetry.get("pm25", 60.0)
            )
        except TypeError:
            # Fallback for 2-parameter signature
            action_plan = calculate_afforestation_plan(
                veg_data.get("plantable_area_m2", 120000), 
                telemetry.get("aqi", 150)
            )

        return {
            "status": "success",
            "location_name": telemetry.get("location_name", "Analyzed Zone"),
            "coordinates": {
                "center": [round(center_lat, 5), round(center_lng, 5)],
                "lat": center_lat,
                "lng": center_lng,
                "bounds": bounds_meta
            },
            "telemetry": telemetry,
            "vegetation": veg_data,
            "action_plan": action_plan
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-canopy-upload")
async def analyze_canopy_upload(file: UploadFile = File(...)):
    if not analyze_canopy_image:
        raise HTTPException(status_code=501, detail="CV engine service module not loaded.")
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