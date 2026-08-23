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
    image:
      "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
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
    map.flyTo(center, zoom, { duration: 1.0 });
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({
  onSelectArea,
  selectionMode,
  polygonPoints,
  setPolygonPoints,
}) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (selectionMode === "polygon") {
        const nextPts = [...polygonPoints, [lat, lng]];
        setPolygonPoints(nextPts);
        if (nextPts.length >= 3) {
          onSelectArea(
            null,
            lat,
            lng,
            `Custom Zone (${nextPts.length} points)`,
            nextPts
          );
        }
      } else {
        const offset = 0.008;
        const newBounds = [
          [lat - offset, lng - offset],
          [lat + offset, lng + offset],
        ];
        onSelectArea(
          newBounds,
          lat,
          lng,
          `Target Zone (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`,
          null
        );
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
  const [isAuthLoading, setIsAuthLoading] = useState(false);

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
  const [activeLocationName, setActiveLocationName] = useState(
    "Jal Mahal, Jaipur"
  );
  const [activeTab, setActiveTab] = useState("diagnostics");
  const [timelineYear, setTimelineYear] = useState(0);
  const [inspectModalTree, setInspectModalTree] = useState(null);

  const [telemetry, setTelemetry] = useState({
    aqi: 178,
    aqi_status: "Unhealthy (Active Stream)",
    pm25: 88.5,
    humidity: 42,
    temperature: 32.4,
    canopy_pct: 18.5,
    water_pct: 12.4,
    water_surface_m2: 31000,
    plantable_area: 145000,
    total_area: 250000,
    current_trees: 1320,
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
    { time: "06:00", aqi: 145, pm25: 68 },
    { time: "10:00", aqi: 198, pm25: 98 },
    { time: "14:00", aqi: 175, pm25: 82 },
    { time: "18:00", aqi: 220, pm25: 110 },
    { time: "22:00", aqi: 185, pm25: 90 },
  ]);

  const validateEmail = (val) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(val);
  };

  const handleLogin = () => {
    if (!validateEmail(email)) {
      setError(
        "Please write a correct valid email address (e.g. name@domain.com)"
      );
      return;
    }
    setError("");
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      setCurrentScreen("portal");
    }, 400);
  };

  const handleGuestAccess = () => {
    setEmail("officer@praanvayu.gov.in");
    setError("");
    setCurrentScreen("portal");
  };

  const handleSelectArea = async (
    newBounds,
    lat,
    lng,
    locationLabel,
    polygonData = null
  ) => {
    if (newBounds) setBounds(newBounds);
    if (locationLabel) setActiveLocationName(locationLabel);

    const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233));
    const dynAqi = Math.round(140 + seed * 150);
    const dynPm25 = Number((55 + seed * 85).toFixed(1));
    const dynTemp = Number((28 + seed * 8).toFixed(1));
    const dynHumidity = Math.round(35 + seed * 35);
    const dynCanopy = Number((12 + seed * 18).toFixed(1));
    const dynWater = Number((8 + seed * 14).toFixed(1));
    const dynTrees = Math.round(2500 + seed * 3000);
    const dynTotalArea = Math.round(220000 + seed * 80000);
    const dynPlantable = Math.round(120000 + seed * 60000);

    setTelemetry({
      aqi: dynAqi,
      aqi_status:
        dynAqi > 200
          ? "Very Unhealthy (Severe Deficit)"
          : dynAqi > 150
          ? "Unhealthy (Active Stream)"
          : "Moderate",
      pm25: dynPm25,
      temperature: dynTemp,
      humidity: dynHumidity,
      canopy_pct: dynCanopy,
      water_pct: dynWater,
      water_surface_m2: Math.round(dynTotalArea * (dynWater / 100)),
      trees_needed: dynTrees,
      total_area: dynTotalArea,
      plantable_area: dynPlantable,
      current_trees: Math.round(1100 + seed * 900),
      pollution_drop_pct: 38,
      oxygen_yield: (dynTrees * 1800).toLocaleString(),
      co2_offset: Math.round(dynTrees * 0.9).toLocaleString(),
    });

    setChartData([
      { time: "06:00", aqi: Math.max(40, dynAqi - 30), pm25: Math.max(20, dynPm25 - 15) },
      { time: "10:00", aqi: dynAqi + 25, pm25: dynPm25 + 18 },
      { time: "14:00", aqi: Math.max(45, dynAqi - 12), pm25: Math.max(24, dynPm25 - 10) },
      { time: "18:00", aqi: dynAqi + 38, pm25: dynPm25 + 24 },
      { time: "22:00", aqi: dynAqi + 12, pm25: dynPm25 + 8 },
    ]);

    const totalBudg = Math.round(dynTrees * 775);
    setBudgetData({
      cost_per_tree_inr: 775,
      total_budget_inr: totalBudg,
      total_budget_lakhs: Number((totalBudg / 100000).toFixed(2)),
      saplings_procurement_inr: Math.round(dynTrees * 125),
      guards_and_infrastructure_inr: Math.round(dynTrees * 250),
      labor_and_plantation_inr: Math.round(dynTrees * 200),
      maintenance_first_year_inr: Math.round(dynTrees * 200),
      estimated_completion_days: Math.max(14, Math.round(dynTrees / 150)),
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

      const res = await axios.post("http://localhost:8000/api/analyze-zone", payload, {
        timeout: 4000,
      });

      if (res.data && res.data.status === "success") {
        const d = res.data;
        if (d.location_name) setActiveLocationName(d.location_name);

        setTelemetry({
          aqi: d.telemetry?.aqi || dynAqi,
          aqi_status: d.telemetry?.aqi_status || "Active Sensor Stream",
          pm25: d.telemetry?.pm25 || dynPm25,
          humidity: d.telemetry?.humidity || dynHumidity,
          temperature: d.telemetry?.temperature || dynTemp,
          canopy_pct: d.vegetation?.canopy_pct || dynCanopy,
          water_pct: d.vegetation?.water_coverage_pct || dynWater,
          water_surface_m2:
            d.vegetation?.water_surface_m2 ||
            Math.round(dynTotalArea * (dynWater / 100)),
          plantable_area: d.vegetation?.plantable_area_m2 || dynPlantable,
          total_area: d.vegetation?.total_area_m2 || dynTotalArea,
          current_trees:
            d.vegetation?.estimated_current_trees ||
            Math.round(1100 + seed * 900),
          trees_needed: d.action_plan?.trees_needed || dynTrees,
          pollution_drop_pct: d.action_plan?.pollution_drop_pct || 38,
          oxygen_yield: (
            d.action_plan?.total_oxygen_yield_kg_per_year || dynTrees * 1800
          ).toLocaleString(),
          co2_offset:
            d.action_plan?.total_co2_offset_tons || Math.round(dynTrees * 0.9),
        });

        if (d.vegetation?.heatmap_overlay_base64) {
          setHeatmapOverlay(d.vegetation.heatmap_overlay_base64);
        } else {
          setHeatmapOverlay(
            generateClientFallbackHeatmap(
              d.vegetation?.canopy_pct || 15,
              d.vegetation?.water_coverage_pct || 12
            )
          );
        }

        if (d.telemetry?.hourly_curve && d.telemetry.hourly_curve.length > 0) {
          setChartData([...d.telemetry.hourly_curve]);
        }
        if (d.action_plan?.budget_breakdown) {
          setBudgetData({ ...d.action_plan.budget_breakdown });
        }
      }
    } catch (e) {
      console.warn("Backend local fallback active.");
      setHeatmapOverlay(generateClientFallbackHeatmap(dynCanopy, dynWater));
    }
  };

  useEffect(() => {
    handleSelectArea(bounds, 26.9537, 75.8463, "Jal Mahal, Jaipur");
  }, []);

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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
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
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setSearching(false);
    }
  };

  const timelineGraphData = [0, 1, 2, 3, 4, 5].map((y) => {
    const baseAqi = telemetry.aqi || 178;
    const maturity = y === 0 ? 0 : Math.min(1, 0.15 + 0.85 * Math.pow(y / 5, 1.2));
    const drop = Math.round(baseAqi * ((telemetry.pollution_drop_pct || 38) / 100) * maturity);
    const projAqi = Math.max(35, baseAqi - drop);
    const canopy = Number(Math.min(48, (telemetry.canopy_pct || 18.5) + 24 * maturity).toFixed(1));
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

  // ==========================================
  // VIEW 1: LOGIN GATEWAY
  // ==========================================
  if (currentScreen === "login") {
    return (
      <div className="relative w-full h-screen bg-[#02050c] overflow-hidden font-sans text-slate-100 select-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen scale-105 filter contrast-125 brightness-90 pointer-events-none"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-[#081b33]/40 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02050c] via-transparent to-[#02050c]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-cyan-200/10 mix-blend-color-dodge pointer-events-none animate-[ping_3.8s_cubic-bezier(0,0,0.2,1)_infinite]" />

        <div className="relative z-10 flex items-center justify-center h-full p-4">
          <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-slate-950/80 backdrop-blur-3xl border border-cyan-500/40 shadow-[0_25px_100px_rgba(0,0,0,0.95)] space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-block group cursor-pointer">
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-cyan-400/25 via-teal-500/20 to-blue-600/30 border border-cyan-400/50 shadow-xl shadow-cyan-500/25 transition-all duration-700 transform group-hover:rotate-180 group-hover:scale-125">
                  <Droplet className="w-9 h-9 text-cyan-300 transition-colors duration-700 group-hover:text-emerald-300" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Atmospheric Telemetry Studio v3.2</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  PraanVayu{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400">
                    Analytics Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-300 mt-1 flex items-center justify-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400 inline" />
                  <span>Satellite Computer Vision & Climate Action</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs flex items-start gap-2 shadow-xl animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Officer Email Address</span>
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className={`w-full px-4 py-3 bg-slate-900/90 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                    error
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-slate-700/90 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  }`}
                  placeholder="officer@praanvayu.gov.in"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Security Password</span>
                  </label>
                  <span className="text-[11px] text-cyan-400/80 font-mono">
                    Demo token ready
                  </span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/90 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3.5 mt-2 rounded-xl font-extrabold bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 hover:brightness-110 active:scale-[0.99] transition shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                <span>Sign In & Launch Engine</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGuestAccess}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/70 hover:border-cyan-400/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trees className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quick Guest Access (1-Click Demo)</span>
              </button>
            </form>

            <div className="pt-1 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Encrypted GeoJSON Cadastral Stream</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PORTAL SEARCH
  // ==========================================
  if (currentScreen === "portal") {
    return (
      <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#060911] overflow-hidden font-sans text-slate-100 p-6 sm:p-10 select-none">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-indigo-500/10 rounded-full blur-[160px] animate-pulse" />
        </div>

        <div className="relative z-20 flex items-center justify-between w-full max-w-7xl mx-auto">
          <button
            onClick={() => setCurrentScreen("login")}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400 text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
          >
            <Home className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-xs font-bold tracking-wide">Home</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PraanVayu Geo-Spatial Engine</span>
          </div>

          <button
            onClick={() => setCurrentScreen("studio")}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-extrabold text-xs tracking-wide transition shadow-xl shadow-emerald-500/20 cursor-pointer"
          >
            <span>Next Page (Studio)</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        <div className="relative z-20 max-w-3xl mx-auto w-full text-center space-y-8 my-auto">
          <div className="space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
              <Trees className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Where would you like to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                Analyze Urban Air & Canopy?
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Enter any city or coordinate to trigger satellite computer vision
              and project 5-year afforestation impact.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center p-2 rounded-2xl bg-slate-900/70 backdrop-blur-2xl border border-emerald-500/40 shadow-[0_15px_50px_rgba(0,0,0,0.6)] focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all duration-300">
              <Search className="w-5 h-5 text-emerald-400 ml-3.5 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any global place (e.g. Unnao, Delhi, Lucknow, Hazratganj, Pink City)..."
                className="w-full px-4 py-3 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black tracking-wider uppercase transition shrink-0 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {searching ? "Scanning..." : "Scan Target"}
              </button>
            </div>
          </form>

          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block">
              Or Select Verified Benchmark Locations
            </span>
            <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  onClick={() => handlePresetSelect(name)}
                  className="group px-4 py-2 rounded-xl bg-slate-900/50 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-20 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time Sentinel & ArcGIS Multispectral Sync Active</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: STUDIO & ANALYTICS
  // ==========================================
  return (
    <div className="relative flex flex-col h-screen bg-[#07090e] text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="relative z-20 px-6 py-3 bg-[#0a0d14] border-b border-slate-800/80 shadow-2xl flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4 shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCurrentScreen("portal")}
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Trees className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
              PRAAN<span className="text-emerald-400">VAYU</span>
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <span className="text-emerald-400 font-bold">GIS Studio</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-400 ml-2">
            <span
              onClick={() => setActiveTab("diagnostics")}
              className={`cursor-pointer hover:text-white transition ${
                activeTab === "diagnostics"
                  ? "text-white font-bold border-b-2 border-emerald-400 pb-1"
                  : ""
              }`}
            >
              Telemetry & Map
            </span>
            <span
              onClick={() => setActiveTab("solution")}
              className={`cursor-pointer hover:text-white transition ${
                activeTab === "solution"
                  ? "text-white font-bold border-b-2 border-emerald-400 pb-1"
                  : ""
              }`}
            >
              Afforestation Mesh
            </span>
            <span className="cursor-pointer hover:text-white transition">
              Municipal Docs
            </span>
          </nav>
        </div>

        <div className="flex-1 max-w-md hidden md:flex justify-center">
          <form onSubmit={handleSearch} className="w-full relative">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search target city or sector..."
                className="w-full pl-9 pr-16 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-1 px-2.5 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-[11px] font-bold transition cursor-pointer"
              >
                {searching ? "..." : "Scan"}
              </button>
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>200 Syncs</span>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>Export ROI</span>
          </button>

          <button
            onClick={() => setCurrentScreen("login")}
            title="Sign Out"
            className="p-1.5 bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Sub-Header Banner */}
      <div className="relative z-10 px-6 py-1.5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border-b border-emerald-900/30 flex items-center justify-between text-xs text-slate-300 print:hidden select-none">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Active Target:{" "}
            <strong className="text-emerald-300">{activeLocationName}</strong>{" "}
            • Satellite Band:{" "}
            <strong className="text-teal-300">ExG Excess Green (2G-R-B)</strong>
          </span>
        </div>
        <div className="flex gap-2">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => handlePresetSelect(name)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                activeLocationName.toLowerCase().includes(name.toLowerCase())
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white bg-slate-800/60"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Content */}
      <div className="relative z-10 flex flex-1 overflow-hidden print:block">
        {/* Left: Map */}
        <div className="w-1/2 h-full relative border-r border-slate-800 print:hidden">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="w-full h-full"
          >
            <TileLayer
              attribution="&copy; Esri World Imagery"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            {showHeatmap && heatmapOverlay && (
              <ImageOverlay
                url={heatmapOverlay}
                bounds={bounds}
                opacity={0.72}
              />
            )}
            {selectionMode === "box" && (
              <Rectangle
                bounds={bounds}
                pathOptions={{
                  color: "#10B981",
                  weight: 2.5,
                  fillOpacity: 0.15,
                  dashArray: "5",
                }}
              />
            )}
            {selectionMode === "polygon" && polygonPoints.length >= 3 && (
              <Polygon
                positions={polygonPoints}
                pathOptions={{
                  color: "#38BDF8",
                  weight: 2.5,
                  fillOpacity: 0.25,
                }}
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

          <div className="absolute top-4 right-4 z-[1000] bg-slate-950/90 backdrop-blur-xl border border-slate-800 p-1.5 rounded-xl shadow-2xl flex items-center gap-1">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                showHeatmap
                  ? "bg-indigo-600 text-white font-bold"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              {showHeatmap ? (
                <Eye className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span>AI Vision Mask</span>
            </button>
            <div className="h-4 w-px bg-slate-800 mx-0.5" />
            <button
              onClick={() => {
                setSelectionMode("box");
                setPolygonPoints([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectionMode === "box"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Square className="w-3.5 h-3.5 inline mr-1" /> Box Zone
            </button>
            <button
              onClick={() => {
                setSelectionMode("polygon");
                setPolygonPoints([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectionMode === "polygon"
                  ? "bg-sky-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Pentagon className="w-3.5 h-3.5 inline mr-1" /> Polygon
            </button>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
            <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-300 shadow-lg flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
              Click anywhere on map to reposition target zone
            </div>

            {showHeatmap && (
              <div className="bg-slate-950/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-300 shadow-xl flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-semibold text-emerald-400">
                    Green Canopy
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span className="font-semibold text-blue-400">
                    River Basin
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  <span className="font-semibold text-red-400">
                    Plantable Deficit
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Studio Dashboard */}
        <div className="w-1/2 h-full overflow-y-auto p-6 space-y-6 bg-[#070a10] print:w-full print:bg-white print:text-black">
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 print:hidden">
            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "diagnostics"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4" /> 1. Pollution & Telemetry Level
            </button>
            <button
              onClick={() => setActiveTab("solution")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "solution"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trees className="w-4 h-4" /> 2. Afforestation Mesh & 3D Twins
            </button>
          </div>

          {/* Tab 1: Diagnostics */}
          {activeTab === "diagnostics" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#0d111a] border border-red-500/30 shadow-xl space-y-2">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Air Quality Index (AQI)</span>
                    <Wind className="w-4 h-4 text-red-400 animate-pulse" />
                  </div>
                  <div className="text-3xl font-black text-red-400 font-mono">
                    {telemetry.aqi}
                  </div>
                  <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded bg-red-950/80 text-red-300 border border-red-800">
                    {telemetry.aqi_status}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d111a] border border-amber-500/30 shadow-xl space-y-2">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>PM2.5 Particulate</span>
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400 font-mono">
                    {telemetry.pm25}
                  </div>
                  <span className="text-xs text-slate-400 block font-mono">
                    µg/m³ (WHO Limit Exceeded)
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d111a] border border-blue-500/30 shadow-xl space-y-2">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>River & Water Coverage</span>
                    <Waves className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-3xl font-black text-blue-400 font-mono">
                    {telemetry.water_pct}%
                  </div>
                  <span className="text-xs text-slate-400 block font-mono">
                    {telemetry.water_surface_m2
                      ? `${Math.round(
                          telemetry.water_surface_m2
                        ).toLocaleString()} m² Basin Surface`
                      : "Surface Moisture"}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d111a] border border-orange-500/30 shadow-xl space-y-2">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Ambient Temp</span>
                    <Thermometer className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-3xl font-black text-orange-400 font-mono">
                    {telemetry.temperature}°C
                  </div>
                  <span className="text-xs text-slate-400 block">
                    Surface Heat Index
                  </span>
                </div>
              </div>

              {/* Diurnal Area Chart */}
              <div className="p-5 rounded-2xl bg-[#0d111a] border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">
                      Diurnal Pollution Curve
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Live 24h trajectory for {activeLocationName}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Live Sensor Feed
                  </span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        fontSize={11}
                      />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="aqi"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#aqiGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("solution")}
                className="w-full py-4 rounded-2xl font-extrabold bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 hover:brightness-110 active:scale-[0.99] transition shadow-2xl shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Trees className="w-5 h-5 text-slate-950" />
                <span>Open Afforestation 3D Twin & Solutions</span>
                <ChevronRight className="w-5 h-5 text-slate-950" />
              </button>
            </div>
          )}

          {/* Tab 2: Solutions */}
          {activeTab === "solution" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Climate Recovery Timeline Slider */}
              <div className="p-5 rounded-2xl bg-[#0d111a] border border-indigo-500/40 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        5-Year Climate Recovery Model
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Slide timeline to project environmental recovery post-plantation
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {timelineYear === 0
                      ? "Year 0 (Today)"
                      : `Year +${timelineYear} Forecast`}
                  </span>
                </div>

                <div className="pt-2 px-1">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={timelineYear}
                    onChange={(e) => setTimelineYear(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2">
                    <span
                      className={
                        timelineYear === 0 ? "text-emerald-400 font-bold" : ""
                      }
                    >
                      Yr 0
                    </span>
                    <span
                      className={
                        timelineYear === 1 ? "text-emerald-400 font-bold" : ""
                      }
                    >
                      Yr 1
                    </span>
                    <span
                      className={
                        timelineYear === 2 ? "text-emerald-400 font-bold" : ""
                      }
                    >
                      Yr 2
                    </span>
                    <span
                      className={
                        timelineYear === 3 ? "text-emerald-400 font-bold" : ""
                      }
                    >
                      Yr 3
                    </span>
                    <span
                      className={
                        timelineYear === 4 ? "text-emerald-400 font-bold" : ""
                      }
                    >
                      Yr 4
                    </span>
                    <span
                      className={
                        timelineYear === 5 ? "text-emerald-400 font-bold" : ""
                      }
                    >
                      Yr 5
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 pt-1 text-center">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      Projected AQI
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">
                      {currentYearSim.aqi}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Drop: -{telemetry.aqi - currentYearSim.aqi}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      Green Canopy
                    </span>
                    <span className="text-lg font-black font-mono text-teal-300 mt-1 block">
                      {currentYearSim.canopyPct}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Target Coverage
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      Surface Cooling
                    </span>
                    <span className="text-lg font-black font-mono text-sky-400 mt-1 block">
                      -{currentYearSim.coolingDelta}°C
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Microclimate Drop
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      O₂ Produced
                    </span>
                    <span className="text-lg font-black font-mono text-green-400 mt-1 block">
                      +{currentYearSim.o2Yieldk}k
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      kg O₂/year
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-bold">
                      5-Year Trajectory (AQI Reduction vs Canopy Expansion)
                    </span>
                    <span className="text-emerald-400 font-mono">
                      Predictive Growth Model
                    </span>
                  </div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineGraphData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                        />
                        <XAxis
                          dataKey="yearLabel"
                          stroke="#64748b"
                          fontSize={11}
                        />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="aqi"
                          name="AQI Level"
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="canopyPct"
                          name="Canopy %"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 3D Asset Library Masonry Cards */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-emerald-400" /> 3D Native Carbon Sinks (AI Asset Library)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Selected species optimized for local soil and PM2.5 interception
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {speciesList.length} Models
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {speciesList.map((tree) => (
                    <div
                      key={tree.id}
                      className="group relative rounded-2xl bg-[#0c1018] border border-slate-800/90 overflow-hidden hover:border-emerald-500/50 hover:shadow-[0_10px_35px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="relative w-full h-48 bg-gradient-to-b from-[#141b27] to-[#0c1018] overflow-hidden flex items-center justify-center p-3">
                        <img
                          src={tree.image}
                          alt={tree.name}
                          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500 filter brightness-95 contrast-105"
                        />

                        <div className="absolute top-4 left-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur border border-slate-700 text-emerald-300">
                            {tree.tag}
                          </span>
                        </div>

                        <div className="absolute top-4 right-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/90 border border-emerald-700 text-emerald-300">
                            {tree.badge}
                          </span>
                        </div>

                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                          <button
                            onClick={() => setInspectModalTree(tree)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-xl text-xs font-black shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Inspect 3D Twin</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 bg-[#0a0d14] border-t border-slate-800/80 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-xs tracking-tight">
                              {tree.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 italic block">
                              {tree.scientific}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-blue-400">
                            ₹{tree.cost_per_sapling_inr}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                          <div>
                            <span className="text-slate-500 block">O₂ Yield:</span>
                            <span className="font-bold text-emerald-400">
                              +{tree.oxygen_kg_year} kg
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">CO₂ Sink:</span>
                            <span className="font-bold text-teal-300">
                              {tree.co2_sink_kg_year} kg
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Municipal Budget Matrix */}
              <div className="p-5 rounded-2xl bg-[#0d111a] border border-blue-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <IndianRupee className="w-4 h-4" /> Municipal Authority Budget & Procurement
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-blue-400 inline mr-1" /> ~{budgetData.estimated_completion_days} Days Execution
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block">Total Investment Budget</span>
                    <span className="text-2xl font-black text-blue-400 font-mono mt-1 block">
                      ₹{budgetData.total_budget_lakhs} Lakhs
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      ₹{budgetData.cost_per_tree_inr} / tree all-inclusive
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block">
                      Annual Carbon & Oxygen Sink
                    </span>
                    <span className="text-base font-bold text-emerald-400 font-mono mt-1 block">
                      +{telemetry.oxygen_yield} kg O₂/yr
                    </span>
                    <span className="text-[10px] text-teal-400 block font-mono">
                      Sink: {telemetry.co2_offset} tons CO₂
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>1. Saplings Procurement ({telemetry.trees_needed} units):</span>
                    <span className="text-white font-bold">
                      ₹{budgetData.saplings_procurement_inr.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>2. Tree Guards & Geo-Tagging Sensors:</span>
                    <span className="text-white font-bold">
                      ₹{budgetData.guards_and_infrastructure_inr.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>3. Pit Digging, Labor & Plantation:</span>
                    <span className="text-white font-bold">
                      ₹{budgetData.labor_and_plantation_inr.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>4. 1-Year Drip Irrigation & Maintenance:</span>
                    <span className="text-white font-bold">
                      ₹{budgetData.maintenance_first_year_inr.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D Inspection Modal */}
      {inspectModalTree && (
        <div className="fixed inset-0 z-[2000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#0d121c] border border-slate-700/80 rounded-3xl overflow-hidden shadow-[0_25px_100px_rgba(0,0,0,0.9)] space-y-4 p-6 animate-fadeIn">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                  {inspectModalTree.tag}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {inspectModalTree.name}
                </h3>
                <span className="text-xs text-slate-400 italic">
                  {inspectModalTree.scientific}
                </span>
              </div>
              <button
                onClick={() => setInspectModalTree(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-72 bg-gradient-to-b from-[#141b27] to-[#090d15] rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src={inspectModalTree.image}
                alt={inspectModalTree.name}
                className="w-full h-full object-cover filter brightness-105"
              />
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                AI Biomass Engine: Active
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">
                  Annual Oxygen Yield
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
                  +{inspectModalTree.oxygen_kg_year} kg/yr
                </span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">
                  Carbon Sequestration
                </span>
                <span className="text-lg font-bold text-teal-300 font-mono mt-1 block">
                  +{inspectModalTree.co2_sink_kg_year} kg/yr
                </span>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">
                  Sapling Cost
                </span>
                <span className="text-lg font-bold text-blue-400 font-mono mt-1 block">
                  ₹{inspectModalTree.cost_per_sapling_inr}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              📍 <strong>Site Placement:</strong> {inspectModalTree.suitability}
            </p>

            <button
              onClick={() => setInspectModalTree(null)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Close Asset Inspection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}