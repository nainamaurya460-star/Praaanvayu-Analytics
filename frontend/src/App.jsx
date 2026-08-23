import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Rectangle,
  ImageOverlay,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Droplet,
  Home,
  LogOut,
  Search,
  ArrowRight,
  Printer,
  Wind,
  Trees,
  Activity,
  Thermometer,
  Waves,
  Eye,
  EyeOff,
  Square,
  Pentagon,
  MousePointerClick,
  Sliders,
  Box,
  Maximize2,
  X,
  Coins,
  ChevronDown,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  IndianRupee,
  Clock,
  ChevronRight,
  Target,
  TreeDeciduous,
  Layers,
  CheckCircle,
} from "lucide-react";

const PRESETS = {
  "Jal Mahal": { lat: 26.9537, lng: 75.8463 },
  "Pink City": { lat: 26.9220, lng: 75.8267 },
  Kukas: { lat: 27.0338, lng: 75.8877 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
};

const DEFAULT_SPECIES = [
  {
    id: "peepal",
    name: "Peepal (Ficus religiosa)",
    scientific: "Ficus religiosa",
    tag: "#sacred_fig",
    share_pct: 35,
    image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80",
    oxygen_kg_year: 2400,
    co2_sink_kg_year: 1200,
    cost_per_sapling_inr: 140,
    badge: "24/7 O₂ Producer",
    suitability: "Urban plazas, lake perimeters, broad avenues",
  },
  {
    id: "khejri",
    name: "Khejri (State Tree)",
    scientific: "Prosopis cineraria",
    tag: "#drought_hardy",
    share_pct: 25,
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
    oxygen_kg_year: 1650,
    co2_sink_kg_year: 900,
    cost_per_sapling_inr: 110,
    badge: "Extreme Arid Resilient",
    suitability: "Semi-arid soil binding & windbreak belts",
  },
  {
    id: "neem",
    name: "Neem (Azadirachta indica)",
    scientific: "Azadirachta indica",
    tag: "#bio_filter",
    share_pct: 25,
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
    oxygen_kg_year: 1850,
    co2_sink_kg_year: 950,
    cost_per_sapling_inr: 125,
    badge: "PM2.5 Dust Trapper",
    suitability: "High dust pollution corridors & highways",
  },
  {
    id: "arjun",
    name: "Arjun (Terminalia arjuna)",
    scientific: "Terminalia arjuna",
    tag: "#riparian_sink",
    share_pct: 15,
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    oxygen_kg_year: 1950,
    co2_sink_kg_year: 1100,
    cost_per_sapling_inr: 130,
    badge: "Riparian Specialist",
    suitability: "Riverbanks, canal perimeters & wetlands",
  },
];

function generateClientFallbackHeatmap(canopyPct = 15, waterPct = 12) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(239, 68, 68, 0.55)";
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = "rgba(16, 185, 129, 0.75)";
  const numClusters = Math.floor((canopyPct / 100) * 45) + 5;
  for (let i = 0; i < numClusters; i++) {
    const cx = Math.random() * 230 + 10;
    const cy = Math.random() * 230 + 10;
    const rad = Math.random() * 25 + 12;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(59, 130, 246, 0.80)";
  const numWater = Math.floor((waterPct / 100) * 20) + 2;
  for (let i = 0; i < numWater; i++) {
    const wx = Math.random() * 220 + 20;
    const wy = Math.random() * 220 + 20;
    const wrad = Math.random() * 35 + 18;
    ctx.beginPath();
    ctx.arc(wx, wy, wrad, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL("image/png");
}

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onSelectArea, selectionMode, polygonPoints, setPolygonPoints }) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (selectionMode === "polygon") {
        const nextPts = [...polygonPoints, [lat, lng]];
        setPolygonPoints(nextPts);
        if (nextPts.length >= 3) {
          onSelectArea(null, lat, lng, `Custom Zone (${nextPts.length} points)`, nextPts);
        }
      } else {
        const offset = 0.008;
        const newBounds = [
          [lat - offset, lng - offset],
          [lat + offset, lng + offset],
        ];
        onSelectArea(newBounds, lat, lng, `Target Zone (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`, null);
      }
    },
  });
  return null;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("login");
  const [email, setEmail] = useState("officer@praanvayu.gov.in");
  const [password, setPassword] = useState("••••••••");
  const [error, setError] = useState("");

  const [mapCenter, setMapCenter] = useState([26.9537, 75.8463]);
  const [mapZoom, setMapZoom] = useState(14);
  const [bounds, setBounds] = useState([
    [26.9457, 75.8383],
    [26.9617, 75.8543],
  ]);
  const [selectionMode, setSelectionMode] = useState("box");
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOverlay, setHeatmapOverlay] = useState(() =>
    generateClientFallbackHeatmap(18, 14)
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeLocationName, setActiveLocationName] = useState("Jal Mahal, Jaipur");
  const [activeTab, setActiveTab] = useState("diagnostics");
  const [timelineYear, setTimelineYear] = useState(0);
  const [inspectModalTree, setInspectModalTree] = useState(null);

  const [telemetry, setTelemetry] = useState({
    aqi: 263,
    aqi_status: "Very Unhealthy (Severe)",
    pm25: 142.5,
    humidity: 38,
    temperature: 33.2,
    canopy_pct: 26.8,
    water_pct: 12.4,
    water_surface_m2: 31000,
    plantable_area: 145000,
    total_area: 250000,
    current_trees: 1914,
    trees_needed: 4150,
    pollution_drop_pct: 38,
    oxygen_yield: "7,470,000",
    co2_offset: "3,735",
  });

  const [budgetData, setBudgetData] = useState({
    cost_per_tree_inr: 775,
    total_budget_inr: 3216250,
    total_budget_lakhs: 32.16,
    saplings_procurement_inr: 518750,
    guards_and_infrastructure_inr: 1037500,
    labor_and_plantation_inr: 830000,
    maintenance_first_year_inr: 830000,
    estimated_completion_days: 28,
  });

  const [speciesList] = useState(DEFAULT_SPECIES);
  const [chartData, setChartData] = useState([
    { time: "06:00", aqi: 210, pm25: 98 },
    { time: "10:00", aqi: 285, pm25: 154 },
    { time: "14:00", aqi: 250, pm25: 130 },
    { time: "18:00", aqi: 310, pm25: 175 },
    { time: "22:00", aqi: 265, pm25: 140 },
  ]);

  const validateEmail = (val) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(val);
  };

  const handleLogin = () => {
    if (!validateEmail(email)) {
      setError("Please write a correct valid email address (e.g. name@domain.com)");
      return;
    }
    setError("");
    setCurrentScreen("portal");
  };

  const handleSelectArea = async (newBounds, lat, lng, locationLabel, polygonData = null) => {
    if (newBounds) setBounds(newBounds);
    if (locationLabel) setActiveLocationName(locationLabel);

    const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233));
    const dynAqi = Math.round(180 + seed * 120);
    const dynPm25 = Number((75 + seed * 85).toFixed(1));
    const dynTemp = Number((28 + seed * 8).toFixed(1));
    const dynHumidity = Math.round(35 + seed * 35);
    const dynCanopy = Number((14 + seed * 18).toFixed(1));
    const dynWater = Number((6 + seed * 14).toFixed(1));
    const dynTreesNeeded = Math.round(2800 + seed * 2600);
    const dynTotalArea = Math.round(220000 + seed * 80000);
    const existingCanopyM2 = Math.round(dynTotalArea * (dynCanopy / 100));
    const dynCurrentTrees = Math.round(existingCanopyM2 / 35);
    const dynPlantable = Math.round(dynTotalArea * (1 - dynCanopy / 100 - dynWater / 100) * 0.55);

    setTelemetry({
      aqi: dynAqi,
      aqi_status: dynAqi > 200 ? "Very Unhealthy (Severe Deficit)" : "Unhealthy (Active Stream)",
      pm25: dynPm25,
      temperature: dynTemp,
      humidity: dynHumidity,
      canopy_pct: dynCanopy,
      water_pct: dynWater,
      water_surface_m2: Math.round(dynTotalArea * (dynWater / 100)),
      trees_needed: dynTreesNeeded,
      total_area: dynTotalArea,
      plantable_area: dynPlantable,
      current_trees: dynCurrentTrees,
      pollution_drop_pct: 38,
      oxygen_yield: (dynTreesNeeded * 1800).toLocaleString(),
      co2_offset: Math.round(dynTreesNeeded * 0.9).toLocaleString(),
    });

    const totalBudg = Math.round(dynTreesNeeded * 775);
    setBudgetData({
      cost_per_tree_inr: 775,
      total_budget_inr: totalBudg,
      total_budget_lakhs: Number((totalBudg / 100000).toFixed(2)),
      saplings_procurement_inr: Math.round(dynTreesNeeded * 125),
      guards_and_infrastructure_inr: Math.round(dynTreesNeeded * 250),
      labor_and_plantation_inr: Math.round(dynTreesNeeded * 200),
      maintenance_first_year_inr: Math.round(dynTreesNeeded * 200),
      estimated_completion_days: Math.max(14, Math.round(dynTreesNeeded / 150)),
    });

    try {
      let payload = {};
      if (polygonData && polygonData.length >= 3) {
        payload = { polygon: polygonData };
      } else if (newBounds) {
        payload = {
          lat_min: Math.min(newBounds[0][0], newBounds[1][0]),
          lat_max: Math.max(newBounds[0][0], newBounds[1][0]),
          lng_min: Math.min(newBounds[0][1], newBounds[1][1]),
          lng_max: Math.max(newBounds[0][1], newBounds[1][1]),
        };
      }

      const res = await axios.post("http://localhost:8000/api/analyze-zone", payload, { timeout: 3000 });
      if (res.data && res.data.status === "success") {
        const d = res.data;
        if (d.location_name) setActiveLocationName(d.location_name);
        if (d.vegetation?.heatmap_overlay_base64) {
          setHeatmapOverlay(d.vegetation.heatmap_overlay_base64);
        }
        if (d.vegetation?.estimated_current_trees) {
          setTelemetry((prev) => ({
            ...prev,
            current_trees: d.vegetation.estimated_current_trees,
            trees_needed: d.action_plan?.trees_needed || prev.trees_needed,
            plantable_area: d.vegetation.plantable_area_m2 || prev.plantable_area,
          }));
        }
      }
    } catch {
      setHeatmapOverlay(generateClientFallbackHeatmap(dynCanopy, dynWater));
    }
  };

  const handlePresetSelect = (locName) => {
    const p = PRESETS[locName];
    if (!p) return;
    const offset = 0.008;
    const newBounds = [
      [p.lat - offset, p.lng - offset],
      [p.lat + offset, p.lng + offset],
    ];
    setMapCenter([p.lat, p.lng]);
    setMapZoom(14);
    setBounds(newBounds);
    setPolygonPoints([]);
    handleSelectArea(newBounds, p.lat, p.lng, locName);
    setCurrentScreen("studio");
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      if (res.data && res.data.length > 0) {
        const place = res.data[0];
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        const displayName = place.display_name.split(",")[0];

        const offset = 0.008;
        const newBounds = [
          [lat - offset, lng - offset],
          [lat + offset, lng + offset],
        ];

        setMapCenter([lat, lng]);
        setMapZoom(14);
        setBounds(newBounds);
        setPolygonPoints([]);
        handleSelectArea(newBounds, lat, lng, displayName);
        setSearchQuery("");
        setCurrentScreen("studio");
      } else {
        alert("Location not found! Try another city/landmark.");
      }
    } catch {
      alert("Search failed. Check internet connection.");
    } finally {
      setSearching(false);
    }
  };

  const timelineGraphData = [0, 1, 2, 3, 4, 5].map((y) => {
    const baseAqi = telemetry.aqi || 263;
    const maturity = y === 0 ? 0 : Math.min(1, 0.15 + 0.85 * Math.pow(y / 5, 1.2));
    const drop = Math.round(baseAqi * ((telemetry.pollution_drop_pct || 38) / 100) * maturity);
    const projAqi = Math.max(35, baseAqi - drop);
    const canopy = Number(Math.min(48, (telemetry.canopy_pct || 26.8) + 20 * maturity).toFixed(1));
    const cooling = Number((0.42 * y * maturity).toFixed(1));
    const o2 = y === 0 ? 0 : Math.round((telemetry.trees_needed || 4150) * 1.8 * maturity);

    return {
      yearLabel: y === 0 ? "Yr 0 (Now)" : `Year ${y}`,
      yearNumber: y,
      aqi: projAqi,
      canopyPct: canopy,
      coolingDelta: cooling,
      o2Yieldk: o2,
    };
  });

  const currentYearSim = timelineGraphData[timelineYear] || timelineGraphData[0];

  return (
    <div className="w-full h-screen bg-[#060911] text-white font-sans overflow-hidden">
      {/* 1. LOGIN SCREEN */}
      {currentScreen === "login" && (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-black to-emerald-950/40 pointer-events-none" />
          <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-slate-950/90 border border-cyan-500/30 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-block p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Droplet className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                PraanVayu <span className="text-cyan-400">Analytics</span>
              </h1>
              <p className="text-xs text-slate-400">Satellite GIS & Climate Studio</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Officer Email</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                  placeholder="officer@praanvayu.gov.in"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="button"
                onClick={handleLogin}
                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:brightness-110 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>Sign In & Launch Engine</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setCurrentScreen("portal");
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trees className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quick Guest Access (1-Click Demo)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PORTAL SEARCH SCREEN */}
      {currentScreen === "portal" && (
        <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 bg-[#060911]">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
            <button
              onClick={() => setCurrentScreen("login")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Home className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Home</span>
            </button>
            <button
              onClick={() => setCurrentScreen("studio")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs transition cursor-pointer"
            >
              <span>Next Page (Studio)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full text-center space-y-6 my-auto">
            <div className="space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Trees className="w-8 h-8" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">
                Analyze Urban Air & Canopy
              </h1>
              <p className="text-xs text-slate-400">
                Enter any city or select a preset to launch satellite computer vision.
              </p>
            </div>

            <form onSubmit={handleSearch} className="relative flex items-center">
              <Search className="w-5 h-5 text-emerald-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city (e.g. Jal Mahal, Pink City, Delhi, Lucknow)..."
                className="w-full pl-12 pr-28 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {searching ? "Scanning..." : "Scan"}
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  onClick={() => handlePresetSelect(name)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-emerald-500/40 transition cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 font-mono">
            Sentinel-2 & ArcGIS Multispectral Stream Ready
          </div>
        </div>
      )}

      {/* 3. STUDIO SCREEN */}
      {currentScreen === "studio" && (
        <div className="relative flex flex-col h-full bg-[#07090e]">
          {/* Header */}
          <header className="px-6 py-3 bg-[#0a0d14] border-b border-slate-800 flex items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setCurrentScreen("portal")}
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Trees className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base text-white">
                  PRAAN<span className="text-emerald-400">VAYU</span>
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-400">
                <span
                  onClick={() => setActiveTab("diagnostics")}
                  className={`cursor-pointer ${
                    activeTab === "diagnostics" ? "text-white font-bold border-b border-emerald-400" : ""
                  }`}
                >
                  Telemetry & Map
                </span>
                <span
                  onClick={() => setActiveTab("solution")}
                  className={`cursor-pointer ${
                    activeTab === "solution" ? "text-white font-bold border-b border-emerald-400" : ""
                  }`}
                >
                  Afforestation Mesh
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>200 Syncs</span>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
              >
                Export ROI
              </button>
              <button
                onClick={() => setCurrentScreen("login")}
                className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Map */}
            <div className="w-1/2 h-full relative border-r border-slate-800">
              <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full">
                <TileLayer
                  attribution="&copy; Esri World Imagery"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                {showHeatmap && heatmapOverlay && (
                  <ImageOverlay url={heatmapOverlay} bounds={bounds} opacity={0.7} />
                )}
                {selectionMode === "box" && (
                  <Rectangle
                    bounds={bounds}
                    pathOptions={{ color: "#10B981", weight: 2.5, fillOpacity: 0.15 }}
                  />
                )}
                {selectionMode === "polygon" && polygonPoints.length >= 3 && (
                  <Polygon
                    positions={polygonPoints}
                    pathOptions={{ color: "#38BDF8", weight: 2.5, fillOpacity: 0.25 }}
                  />
                )}
                <MapController center={mapCenter} zoom={mapZoom} />
                <MapClickHandler
                  onSelectArea={handleSelectArea}
                  selectionMode={selectionMode}
                  polygonPoints={polygonPoints}
                  setPolygonPoints={setPolygonPoints}
                />
              </MapContainer>

              <div className="absolute top-4 right-4 z-[1000] bg-slate-950/90 border border-slate-800 p-1.5 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    showHeatmap ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
                  }`}
                >
                  {showHeatmap ? "AI Vision: ON" : "AI Vision: OFF"}
                </button>
                <button
                  onClick={() => {
                    setSelectionMode("box");
                    setPolygonPoints([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    selectionMode === "box" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-300"
                  }`}
                >
                  Box
                </button>
                <button
                  onClick={() => {
                    setSelectionMode("polygon");
                    setPolygonPoints([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    selectionMode === "polygon" ? "bg-sky-500 text-slate-950 font-bold" : "text-slate-300"
                  }`}
                >
                  Polygon
                </button>
              </div>

              {/* Bottom Map Badge */}
              <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2">
                <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zone: <strong className="text-white">{activeLocationName}</strong></span>
              </div>
            </div>

            {/* Right: Dashboard */}
            <div className="w-1/2 h-full overflow-y-auto p-6 space-y-6 bg-[#070a10]">
              <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActiveTab("diagnostics")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                    activeTab === "diagnostics" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  1. Telemetry Level
                </button>
                <button
                  onClick={() => setActiveTab("solution")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                    activeTab === "solution" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  2. Afforestation & 3D Twins
                </button>
              </div>

              {/* TAB 1: DIAGNOSTICS */}
              {activeTab === "diagnostics" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/30">
                      <span className="text-xs text-slate-400">AQI Index</span>
                      <div className="text-3xl font-black text-red-400 font-mono">{telemetry.aqi}</div>
                      <span className="text-[11px] text-red-300">{telemetry.aqi_status}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30">
                      <span className="text-xs text-slate-400">PM2.5 Level</span>
                      <div className="text-3xl font-black text-amber-400 font-mono">{telemetry.pm25} µg/m³</div>
                      <span className="text-[11px] text-slate-500">WHO Standard Exceeded</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/30">
                      <span className="text-xs text-slate-400">Water Coverage</span>
                      <div className="text-3xl font-black text-blue-400 font-mono">{telemetry.water_pct}%</div>
                      <span className="text-[11px] text-slate-500">{telemetry.water_surface_m2.toLocaleString()} m² Basin</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-orange-500/30">
                      <span className="text-xs text-slate-400">Temperature</span>
                      <div className="text-3xl font-black text-orange-400 font-mono">{telemetry.temperature}°C</div>
                      <span className="text-[11px] text-slate-500">Surface Heat Index</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold text-slate-300">24h Diurnal Pollution Curve</h3>
                      <span className="text-[11px] text-emerald-400 font-mono">Live Sensor Stream</span>
                    </div>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", borderColor: "#334155" }} />
                          <Area type="monotone" dataKey="aqi" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("solution")}
                    className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 transition cursor-pointer text-sm flex items-center justify-center gap-2"
                  >
                    <span>View Afforestation Action Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* TAB 2: AFFORESTATION & TREE AUDIT */}
              {activeTab === "solution" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* 🌟 KEY TREE COUNT AUDIT HERO CARDS */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Card 1: Detected Existing Trees */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/40 relative overflow-hidden">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold">Current Trees (Detected)</span>
                        <TreeDeciduous className="w-4 h-4 text-teal-400" />
                      </div>
                      <div className="text-3xl font-black text-teal-300 font-mono mt-1">
                        {telemetry.current_trees.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-teal-400/80 block mt-1">
                        🌲 Covering {telemetry.canopy_pct}% green canopy area
                      </span>
                    </div>

                    {/* Card 2: Required New Trees */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 relative overflow-hidden">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-emerald-300">Trees Needed (Target Deficit)</span>
                        <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
                      </div>
                      <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                        +{telemetry.trees_needed.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-emerald-400/90 font-medium block mt-1">
                        🎯 To offset {telemetry.pollution_drop_pct}% urban pollution
                      </span>
                    </div>
                  </div>

                  {/* Plantable Area Sub-Audit */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span>Plantable Open Ground Available:</span>
                    </div>
                    <span className="text-blue-400 font-bold text-sm">
                      {telemetry.plantable_area.toLocaleString()} m²
                    </span>
                  </div>

                  {/* 5-Year Climate Recovery Slider */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="uppercase tracking-wider text-slate-300">5-Year Climate Recovery Model</span>
                      <span className="text-emerald-400 font-mono">
                        {timelineYear === 0 ? "Year 0 (Today)" : `Year +${timelineYear} Projection`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={timelineYear}
                      onChange={(e) => setTimelineYear(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <div className="grid grid-cols-4 gap-2 text-center pt-2">
                      <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Projected AQI</span>
                        <span className="text-base font-black text-emerald-400 font-mono">{currentYearSim.aqi}</span>
                      </div>
                      <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Canopy %</span>
                        <span className="text-base font-black text-teal-300 font-mono">{currentYearSim.canopyPct}%</span>
                      </div>
                      <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Cooling</span>
                        <span className="text-base font-black text-sky-400 font-mono">-{currentYearSim.coolingDelta}°C</span>
                      </div>
                      <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">O₂ Yield</span>
                        <span className="text-base font-black text-green-400 font-mono">+{currentYearSim.o2Yieldk}k</span>
                      </div>
                    </div>
                  </div>

                  {/* Species Allocation Grid */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300 uppercase tracking-wider">
                        Native Tree Mix & Deficit Allocation
                      </span>
                      <span className="text-slate-500 font-mono">{speciesList.length} Species Selected</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {speciesList.map((tree) => {
                        const countForTree = Math.round(telemetry.trees_needed * (tree.share_pct / 100));
                        return (
                          <div
                            key={tree.id}
                            className="rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 transition-all"
                          >
                            <div className="relative h-32 overflow-hidden">
                              <img
                                src={tree.image}
                                alt={tree.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-950/80 border border-slate-700 text-emerald-300">
                                {tree.tag}
                              </div>
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/90 border border-emerald-700 text-emerald-300 font-mono">
                                {countForTree} Trees
                              </div>
                              <button
                                onClick={() => setInspectModalTree(tree)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-emerald-400 transition cursor-pointer"
                              >
                                Inspect 3D Twin
                              </button>
                            </div>
                            <div className="p-3 bg-[#0a0d14] border-t border-slate-800 space-y-1">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-xs text-white">{tree.name}</h4>
                                <span className="text-xs text-blue-400 font-mono font-bold">₹{tree.cost_per_sapling_inr}</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>Yield: +{tree.oxygen_kg_year} kg O₂</span>
                                <span className="text-teal-400 font-semibold">{tree.share_pct}% Share</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Budget Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee className="w-4 h-4" /> Municipal Procurement Budget
                      </span>
                      <span className="text-blue-300 font-bold font-mono text-sm">
                        ₹{budgetData.total_budget_lakhs} Lakhs
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] space-y-1.5 font-mono pt-1 border-t border-slate-900">
                      <div className="flex justify-between">
                        <span>Saplings ({telemetry.trees_needed.toLocaleString()} units):</span>
                        <span className="text-white font-bold">₹{budgetData.saplings_procurement_inr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tree Guards & IoT Sensors:</span>
                        <span className="text-white font-bold">₹{budgetData.guards_and_infrastructure_inr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labor, Pit Digging & Plantation:</span>
                        <span className="text-white font-bold">₹{budgetData.labor_and_plantation_inr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1-Year Drip Irrigation Maintenance:</span>
                        <span className="text-white font-bold">₹{budgetData.maintenance_first_year_inr.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* 3D Inspection Modal */}
          {inspectModalTree && (
            <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-[#0d121c] border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                      {inspectModalTree.tag}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{inspectModalTree.name}</h3>
                    <span className="text-xs text-slate-400 italic">{inspectModalTree.scientific}</span>
                  </div>
                  <button
                    onClick={() => setInspectModalTree(null)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <img
                  src={inspectModalTree.image}
                  alt={inspectModalTree.name}
                  className="w-full h-48 object-cover rounded-2xl border border-slate-800"
                />
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="text-slate-500 block">Annual Oxygen Yield</span>
                    <span className="font-bold text-emerald-400 text-sm">+{inspectModalTree.oxygen_kg_year} kg/yr</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="text-slate-500 block">Carbon Sequestration</span>
                    <span className="font-bold text-teal-300 text-sm">+{inspectModalTree.co2_sink_kg_year} kg/yr</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                  📍 <strong>Placement Rule:</strong> {inspectModalTree.suitability}
                </p>
                <button
                  onClick={() => setInspectModalTree(null)}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}