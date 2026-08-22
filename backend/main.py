from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from services.air_quality import fetch_air_quality
from services.tree_calculator import calculate_tree_deficit

app = FastAPI(
    title="PraanVayu Analytics Engine",
    description="Precision Urban Forestry & Micro-Climate Intelligence API",
    version="1.0.0"
)

# CORS setup for frontend dashboard integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeZoneRequest(BaseModel):
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

        # Ingest live telemetry
        telemetry = await fetch_air_quality(lat=center_lat, lon=center_lng)

        # Calculate exact tree deficit
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)