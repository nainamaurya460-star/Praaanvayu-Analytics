# 🌿 PraanVayu Analytics Engine
> **Real-Time Satellite Computer Vision & Atmospheric AI Telemetry for Hyperlocal Afforestation Planning**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_Vite-61DAFB.svg?logo=react)](https://react.dev/)
[![OpenCV](https://img.shields.io/badge/AI%2FCV-OpenCV_4.x-5C3EE8.svg?logo=opencv)](https://opencv.org/)
[![Leaflet](https://img.shields.io/badge/GIS-Esri_World_Imagery-199900.svg?logo=leaflet)](https://leafletjs.com/)

---

## 📌 Executive Summary
**PraanVayu** is an enterprise-grade environmental planning platform that enables urban local bodies (ULBs), municipal corporations, and environmental engineers to audit land canopy deficits using real-time satellite computer vision and design high-impact native afforestation projects.

---

## ⚡ Key Capabilities & Engineering Architecture

1. **🛰️ Live Satellite Computer Vision (ArcGIS & OpenCV):**
   - Haversine spherical geodesy for precise polygon $m^2$ calculations.
   - Dynamic HSV thresholding and Excess Green Index (ExG) segmentation for accurate green canopy vs barren soil detection.
   - Water body pixel masking (e.g., Jal Mahal Lake) to prevent false plantation allocations.

2. **🌬️ Real-Time Sensor Telemetry Pipeline (Open-Meteo & Copernicus):**
   - Zero-mock atmospheric stream: Real US AQI, PM2.5, PM10, ambient temperature, and relative humidity.
   - Diurnal 24-hour pollution trajectory curve for target zones.

3. **📊 Municipal Procurement & Action Plan Generator:**
   - 33% National Forest Policy target deficit analysis.
   - Comprehensive budget breakdown (saplings, tree guards, labor excavation, 1-year maintenance).
   - Ranked native species recommendations (Peepal, Khejri, Neem, Arjun) with individual O₂/CO₂ yield metrics.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, React-Leaflet, Lucide Icons, Recharts
- **Backend:** FastAPI, Python 3.10+, Uvicorn, Requests, NumPy
- **Computer Vision:** OpenCV (cv2)
- **External Data Providers:** ArcGIS World Imagery Server, Open-Meteo Air Quality & Weather API, OpenStreetMap Nominatim

---

## 🚀 Quick Setup & Installation

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
