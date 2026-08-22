from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.air_quality import fetch_air_quality
from services.satellite_cv import analyze_satellite_pixels
from services.tree_calculator import calculate_tree_plan

app = FastAPI(title="PraanVayu Analytics Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CoordinateBounds(BaseModel):
    lat_min: float
    lat_max: float
    lng_min: float
    lng_max: float

@app.get("/api/health")
async def health_check():
    return {"status": "active", "service": "PraanVayu Core API"}

@app.post("/api/analyze-zone")
async def analyze_zone(bounds: CoordinateBounds):
    try:
        telemetry = await fetch_air_quality(
            lat=(bounds.lat_min + bounds.lat_max) / 2.0,
            lng=(bounds.lng_min + bounds.lng_max) / 2.0
        )
        
        vegetation = analyze_satellite_pixels(
            bounds.lat_min, bounds.lat_max, bounds.lng_min, bounds.lng_max
        )
        
        action_plan = calculate_tree_plan(
            plantable_area_m2=vegetation["plantable_area_m2"],
            canopy_pct=vegetation["canopy_pct"],
            aqi=telemetry["aqi"]
        )

        return {
            "status": "success",
            "coordinates": bounds.model_dump() if hasattr(bounds, 'model_dump') else bounds.dict(),
            "telemetry": telemetry,
            "vegetation": vegetation,
            "action_plan": action_plan
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))