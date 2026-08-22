import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Rectangle, Polygon, useMapEvents, useMap } from 'react-leaflet';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Wind, Trees, Droplets, Thermometer, Sparkles, 
  ShieldCheck, ChevronRight, Activity, MapPin, Search, Loader2, Download, IndianRupee, Clock, Square, Pentagon, RotateCcw, MousePointerClick, Sliders
} from 'lucide-react';

const LANDMARK_PRESETS = [
  { name: "Jal Mahal", lat: 26.9537, lng: 75.8463, zoom: 15 },
  { name: "Kukas", lat: 27.0338, lng: 75.8877, zoom: 14 },
  { name: "Pink City", lat: 26.9220, lng: 75.8267, zoom: 15 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462, zoom: 14 }
];

const DEFAULT_SPECIES = [
  {
    name: "Peepal (Ficus religiosa)",
    scientific: "Ficus religiosa",
    image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80",
    oxygen_kg_year: 2400,
    co2_sink_kg_year: 1200,
    cost_per_sapling_inr: 140,
    badge: "24/7 Oxygen Sink",
    suitability: "Ideal for broad avenues, urban plazas, and lake perimeters"
  },
  {
    name: "Khejri (State Tree)",
    scientific: "Prosopis cineraria",
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    oxygen_kg_year: 1650,
    co2_sink_kg_year: 900,
    cost_per_sapling_inr: 110,
    badge: "Extreme Drought Hardy",
    suitability: "Essential for dry semi-arid land & soil binding"
  },
  {
    name: "Neem (Azadirachta indica)",
    scientific: "Azadirachta indica",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
    oxygen_kg_year: 1850,
    co2_sink_kg_year: 950,
    cost_per_sapling_inr: 125,
    badge: "Natural Bio-Filter",
    suitability: "High dust and PM2.5 trapping near highways"
  },
  {
    name: "Arjun (Terminalia arjuna)",
    scientific: "Terminalia arjuna",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    oxygen_kg_year: 1950,
    co2_sink_kg_year: 1100,
    cost_per_sapling_inr: 130,
    badge: "Riparian Specialist",
    suitability: "Lake banks, ponds & high moisture ground"
  }
];

// Mathematical 5-Year Climate Projection Model
const calculateSimulation = (year, telemetry) => {
  const y = Number(year);
  const baseAqi = telemetry.aqi || 178;
  const baseCanopy = telemetry.canopy_pct || 18.5;
  const treesNeeded = telemetry.trees_needed || 4150;
  const dropPct = telemetry.pollution_drop_pct || 38;

  if (y === 0) {
    return {
      year: 0,
      stage: "Baseline (Current State)",
      projectedAqi: baseAqi,
      canopyPct: baseCanopy,
      co2Offset: "0",
      oxygenYield: "0",
      coolingDelta: "0.0°C",
      dropAmount: 0
    };
  }

  const maturityFactor = Math.min(1, 0.15 + 0.85 * Math.pow(y / 5, 1.2));
  const survivalFactor = 1 - (0.03 * (5 - y));

  const aqiReduction = Math.round(baseAqi * (dropPct / 100) * maturityFactor);
  const projectedAqi = Math.max(35, baseAqi - aqiReduction);
  const targetCanopy = Math.min(48, baseCanopy + (24 * maturityFactor));
  const totalO2 = Math.round(treesNeeded * 1800 * maturityFactor * survivalFactor);
  const totalCo2 = Math.round(treesNeeded * 0.95 * maturityFactor * survivalFactor);
  const cooling = (0.42 * y * maturityFactor).toFixed(1);

  const stageLabels = {
    1: "Sapling Establishment & Rooting",
    2: "Early Foliage Growth & Bio-Trap Activation",
    3: "Mid-Canopy Microclimate Formation",
    4: "Advanced Dust Interception & Shading",
    5: "Fully Mature Urban Carbon Sink"
  };

  return {
    year: y,
    stage: stageLabels[y] || "Mature Ecosystem",
    projectedAqi,
    canopyPct: Number(targetCanopy.toFixed(1)),
    co2Offset: totalCo2.toLocaleString(),
    oxygenYield: totalO2.toLocaleString(),
    coolingDelta: `-${cooling}°C`,
    dropAmount: aqiReduction
  };
};

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onSelectArea, selectionMode, polygonPoints, setPolygonPoints }) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (selectionMode === 'polygon') {
        const nextPts = [...polygonPoints, [lat, lng]];
        setPolygonPoints(nextPts);
        if (nextPts.length >= 3) {
          onSelectArea(null, lat, lng, `Custom Polygon (${nextPts.length} points)`, nextPts);
        }
      } else {
        const offset = 0.008; 
        const newBounds = [
          [lat - offset, lng - offset],
          [lat + offset, lng + offset]
        ];
        onSelectArea(newBounds, lat, lng, `Target Point (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`, null);
      }
    }
  });
  return null;
}

export default function App() {
  const [mapCenter, setMapCenter] = useState([26.9537, 75.8463]);
  const [mapZoom, setMapZoom] = useState(14);
  const [bounds, setBounds] = useState([
    [26.9457, 75.8383],
    [26.9617, 75.8543]
  ]);
  const [selectionMode, setSelectionMode] = useState('box');
  const [polygonPoints, setPolygonPoints] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeLocationName, setActiveLocationName] = useState("Jal Mahal, Jaipur");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('diagnostics');
  const [simulationYear, setSimulationYear] = useState(0);
  
  const [telemetry, setTelemetry] = useState({
    aqi: 0,
    aqi_status: "Fetching Live Telemetry...",
    pm25: 0,
    humidity: 0,
    temp: 0,
    canopy_pct: 0,
    plantable_area: 0,
    total_area: 0,
    current_trees: 0,
    trees_needed: 0,
    pollution_drop_pct: 0,
    oxygen_yield: "0",
    co2_offset: "0"
  });

  const [budgetData, setBudgetData] = useState({
    cost_per_tree_inr: 775,
    total_budget_inr: 0,
    total_budget_lakhs: 0,
    saplings_procurement_inr: 0,
    guards_and_infrastructure_inr: 0,
    labor_and_plantation_inr: 0,
    maintenance_first_year_inr: 0,
    estimated_completion_days: 14
  });

  const [speciesList, setSpeciesList] = useState(DEFAULT_SPECIES);
  const [chartData, setChartData] = useState([]);

  const simData = calculateSimulation(simulationYear, telemetry);

  const handleSelectArea = async (newBounds, lat, lng, locationLabel, polygonData = null) => {
    if (newBounds) setBounds(newBounds);
    setProcessing(true);
    if (locationLabel) setActiveLocationName(locationLabel);

    try {
      let payload = {};
      if (polygonData && polygonData.length >= 3) {
        payload = { polygon: polygonData };
      } else if (newBounds) {
        payload = {
          lat_min: Math.min(newBounds[0][0], newBounds[1][0]),
          lat_max: Math.max(newBounds[0][0], newBounds[1][0]),
          lng_min: Math.min(newBounds[0][1], newBounds[1][1]),
          lng_max: Math.max(newBounds[0][1], newBounds[1][1])
        };
      }

      const res = await axios.post("http://127.0.0.1:8000/api/analyze-zone", payload);
      if (res.data && res.data.status === "success") {
        const d = res.data;
        if (d.location_name) {
          setActiveLocationName(d.location_name);
        }
        
        setTelemetry({
          aqi: d.telemetry.aqi,
          aqi_status: d.telemetry.aqi_status || "Active Sensor Feed",
          pm25: d.telemetry.pm25,
          humidity: d.telemetry.humidity,
          temp: d.telemetry.temperature,
          canopy_pct: d.vegetation.canopy_pct,
          plantable_area: d.vegetation.plantable_area_m2,
          total_area: d.vegetation.total_area_m2,
          current_trees: d.vegetation.estimated_current_trees || Math.round(d.vegetation.existing_canopy_m2 / 35),
          trees_needed: d.action_plan.trees_needed,
          pollution_drop_pct: d.action_plan.pollution_drop_pct,
          oxygen_yield: (d.action_plan.total_oxygen_yield_kg_per_year || 0).toLocaleString(),
          co2_offset: d.action_plan.total_co2_offset_tons || 0
        });

        if (d.telemetry.hourly_curve && d.telemetry.hourly_curve.length > 0) {
          setChartData([...d.telemetry.hourly_curve]);
        }
        if (d.action_plan.budget_breakdown) {
          setBudgetData({ ...d.action_plan.budget_breakdown });
        }
        if (d.action_plan.recommended_species && d.action_plan.recommended_species.length > 0) {
          setSpeciesList([...d.action_plan.recommended_species]);
        }
      }
    } catch (e) {
      console.error("Backend request failed:", e);
    } finally {
      setTimeout(() => setProcessing(false), 300);
    }
  };

  useEffect(() => {
    handleSelectArea(bounds, 26.9537, 75.8463, "Jal Mahal, Jaipur");
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
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
        const displayName = place.display_name.split(',')[0];

        setMapCenter([lat, lng]);
        setMapZoom(14);
        const offset = 0.008;
        const newBounds = [
          [lat - offset, lng - offset],
          [lat + offset, lng + offset]
        ];
        setPolygonPoints([]);
        handleSelectArea(newBounds, lat, lng, displayName);
        setSearchQuery("");
      } else {
        alert("Location not found! Try another city/landmark name.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
      alert("Error finding location.");
    } finally {
      setSearching(false);
    }
  };

  const jumpToLocation = (preset) => {
    setMapCenter([preset.lat, preset.lng]);
    setMapZoom(preset.zoom);
    setPolygonPoints([]);
    const offset = 0.008;
    const newBounds = [
      [preset.lat - offset, preset.lng - offset],
      [preset.lat + offset, preset.lng + offset]
    ];
    handleSelectArea(newBounds, preset.lat, preset.lng, preset.name);
  };

  return (
    <div className="flex flex-col h-screen bg-[#070b14] text-slate-100 font-sans">
      
      {/* HEADER */}
      <header className="px-6 py-3 bg-[#0d1527] border-b border-emerald-950/60 shadow-xl flex items-center justify-between z-10 gap-4 print:hidden">
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Trees className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Welcome to <span className="text-emerald-400">PraanVayu</span> Analytics Engine
            </h1>
            <p className="text-[11px] text-slate-400">
              Select your targeted area on the map to save earth & fight pollution.
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any place (e.g. Lucknow, Kukas, Connaught Place)..."
              className="w-full pl-10 pr-24 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute right-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        {/* Presets & Export */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            {LANDMARK_PRESETS.map((loc, i) => (
              <button
                key={i}
                onClick={() => jumpToLocation(loc)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeLocationName.toLowerCase().includes(loc.name.toLowerCase())
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Action Plan</span>
          </button>
        </div>
      </header>

      {/* PROCESSING TOAST */}
      {processing && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 px-4 py-2 font-black text-center text-sm shadow-md animate-pulse flex items-center justify-center gap-2 print:hidden">
          <Sparkles className="w-5 h-5" />
          Scanning satellite pixels & executing afforestation models for {activeLocationName}...
        </div>
      )}

      {/* MAIN VIEW */}
      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        
        {/* SATELLITE MAP */}
        <div className="w-1/2 h-full relative border-r border-slate-800 print:hidden">
          <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full">
            <TileLayer
              attribution='&copy; Esri World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            {selectionMode === 'box' && (
              <Rectangle bounds={bounds} pathOptions={{ color: '#10B981', weight: 2.5, fillOpacity: 0.25, dashArray: '5' }} />
            )}
            {selectionMode === 'polygon' && polygonPoints.length >= 3 && (
              <Polygon positions={polygonPoints} pathOptions={{ color: '#38BDF8', weight: 2.5, fillOpacity: 0.35 }} />
            )}
            <MapController center={mapCenter} zoom={mapZoom} />
            <MapClickHandler 
              onSelectArea={handleSelectArea} 
              selectionMode={selectionMode} 
              polygonPoints={polygonPoints} 
              setPolygonPoints={setPolygonPoints} 
            />
          </MapContainer>

          {/* Active Target Banner */}
          <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs text-slate-200 shadow-xl flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Active: <span className="font-bold text-emerald-400">{activeLocationName}</span>
          </div>

          {/* Selection Tool Mode Switcher */}
          <div className="absolute top-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur border border-slate-700/90 p-1.5 rounded-xl shadow-xl flex items-center gap-1">
            <button
              onClick={() => { setSelectionMode('box'); setPolygonPoints([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectionMode === 'box' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Square className="w-3.5 h-3.5" /> Box Zone
            </button>
            <button
              onClick={() => { setSelectionMode('polygon'); setPolygonPoints([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectionMode === 'polygon' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Pentagon className="w-3.5 h-3.5" /> Freehand Polygon
            </button>
            {selectionMode === 'polygon' && polygonPoints.length > 0 && (
              <button
                onClick={() => { setPolygonPoints([]); handleSelectArea(bounds, mapCenter[0], mapCenter[1], activeLocationName); }}
                title="Reset Polygon Points"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-xl text-[11px] text-slate-300 shadow-lg flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
            {selectionMode === 'box' 
              ? 'Click anywhere on map to reposition target zone' 
              : `Click 3+ points to define boundary (Points selected: ${polygonPoints.length})`}
          </div>
        </div>

        {/* DASHBOARD TABS */}
        <div className="w-1/2 h-full overflow-y-auto p-6 space-y-6 bg-[#0a0f1d] print:w-full print:bg-white print:text-black print:p-0">
          
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 print:hidden">
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'diagnostics' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" /> 1. Pollution & Telemetry Level
            </button>
            <button
              onClick={() => setActiveTab('solution')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'solution' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trees className="w-4 h-4" /> 2. Solving Steps & Procurement
            </button>
          </div>

          {/* TAB 1: DIAGNOSTICS */}
          {(activeTab === 'diagnostics' || window.matchMedia('print').matches) && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#0e162a] border border-red-500/30 shadow-lg print:border-gray-300 print:bg-gray-100">
                  <div className="flex justify-between items-center text-slate-400 text-xs print:text-gray-600">
                    <span>Air Quality Index (AQI)</span>
                    <Wind className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-3xl font-black text-red-400 font-mono mt-2">{telemetry.aqi}</div>
                  <span className="inline-block mt-2 px-2 py-0.5 text-[11px] font-bold rounded bg-red-950/80 text-red-300 border border-red-800 print:bg-red-100 print:text-red-700">
                    {telemetry.aqi_status}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e162a] border border-amber-500/30 shadow-lg print:border-gray-300 print:bg-gray-100">
                  <div className="flex justify-between items-center text-slate-400 text-xs print:text-gray-600">
                    <span>PM2.5 Particulate</span>
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400 font-mono mt-2">{telemetry.pm25}</div>
                  <span className="text-xs text-slate-400 mt-2 block font-mono print:text-gray-600">µg/m³ (WHO Limit Exceeded)</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e162a] border border-blue-500/30 shadow-lg print:border-gray-300 print:bg-gray-100">
                  <div className="flex justify-between items-center text-slate-400 text-xs print:text-gray-600">
                    <span>Humidity</span>
                    <Droplets className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-3xl font-black text-blue-400 font-mono mt-2">{telemetry.humidity}%</div>
                  <span className="text-xs text-slate-400 mt-2 block print:text-gray-600">Atmospheric Moisture</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e162a] border border-orange-500/30 shadow-lg print:border-gray-300 print:bg-gray-100">
                  <div className="flex justify-between items-center text-slate-400 text-xs print:text-gray-600">
                    <span>Ambient Temp</span>
                    <Thermometer className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-3xl font-black text-orange-400 font-mono mt-2">{telemetry.temp}°C</div>
                  <span className="text-xs text-slate-400 mt-2 block print:text-gray-600">Surface Heat Index</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e162a] border border-slate-800 shadow-xl print:hidden">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Diurnal Pollution Curve</h3>
                    <p className="text-[11px] text-slate-400">Live 24h trajectory for {activeLocationName}</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono font-semibold">Sensor Stream</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="aqi" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#aqiGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('solution')}
                className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 print:hidden"
              >
                <span>Proceed to Solving Steps of Problem</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* TAB 2: PROBLEM SOLVING & MUNICIPAL BUDGET */}
          {(activeTab === 'solution' || window.matchMedia('print').matches) && (
            <div className="space-y-6">
              
              {/* NEW: TIME-LAPSE CLIMATE IMPACT SIMULATION SLIDER */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-[#0e162a] to-emerald-950/30 border border-indigo-500/40 shadow-xl space-y-4 print:border-gray-300 print:bg-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider print:text-gray-900">
                        5-Year Climate Twin Simulation
                      </h3>
                      <p className="text-[11px] text-slate-400 print:text-gray-600">
                        Slide timeline to project environmental recovery post-plantation
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {simulationYear === 0 ? "Year 0 (Today)" : `Year +${simulationYear} Forecast`}
                  </span>
                </div>

                {/* Range Slider */}
                <div className="pt-2 px-1">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={simulationYear}
                    onChange={(e) => setSimulationYear(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2">
                    <span className={simulationYear === 0 ? "text-emerald-400 font-bold" : ""}>Yr 0 (Base)</span>
                    <span className={simulationYear === 1 ? "text-emerald-400 font-bold" : ""}>Yr 1 (Sapling)</span>
                    <span className={simulationYear === 2 ? "text-emerald-400 font-bold" : ""}>Yr 2</span>
                    <span className={simulationYear === 3 ? "text-emerald-400 font-bold" : ""}>Yr 3 (Canopy)</span>
                    <span className={simulationYear === 4 ? "text-emerald-400 font-bold" : ""}>Yr 4</span>
                    <span className={simulationYear === 5 ? "text-emerald-400 font-bold" : ""}>Yr 5 (Mature)</span>
                  </div>
                </div>

                {/* Ecological Stage Description */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400">Ecological Progression: </span>
                  <span className="text-xs font-bold text-emerald-400">{simData.stage}</span>
                </div>

                {/* Dynamic Projected Metric Cards */}
                <div className="grid grid-cols-4 gap-2.5 pt-1 text-center">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Projected AQI</span>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {simData.projectedAqi}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {simulationYear === 0 ? "Baseline" : `Drop: -${simData.dropAmount}`}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Green Canopy</span>
                    <span className="text-lg font-black font-mono text-teal-300">
                      {simData.canopyPct}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">Target Coverage</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Surface Cooling</span>
                    <span className="text-lg font-black font-mono text-sky-400">
                      {simData.coolingDelta}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Microclimate Drop</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">O₂ Produced</span>
                    <span className="text-lg font-black font-mono text-green-400">
                      {simData.oxygenYield ? (simulationYear === 0 ? "0" : simData.oxygenYield.slice(0, 4) + "k") : "0"}
                    </span>
                    <span className="text-[10px] text-slate-500 block">kg O₂/year</span>
                  </div>
                </div>
              </div>

              {/* Capacity Deficit Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0e162a] to-[#0e162a] border border-emerald-500/30 space-y-4 print:border-gray-300 print:bg-gray-100">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider print:text-emerald-700">
                  <ShieldCheck className="w-4 h-4" /> Zone Capacity & Ecological Deficit
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 print:bg-white">
                    <span className="text-[11px] text-slate-400 block print:text-gray-500">Total Land Area</span>
                    <span className="text-base font-bold font-mono text-white print:text-gray-900">{(telemetry.total_area / 10000).toFixed(2)} Ha</span>
                    <span className="text-[10px] text-slate-500 font-mono">({Math.round(telemetry.total_area).toLocaleString()} m²)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 print:bg-white">
                    <span className="text-[11px] text-slate-400 block print:text-gray-500">Current Trees</span>
                    <span className="text-base font-bold font-mono text-amber-400 print:text-amber-600">{telemetry.current_trees} Existing</span>
                    <span className="text-[10px] text-slate-500">Canopy: {telemetry.canopy_pct}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-600/40 print:bg-white">
                    <span className="text-[11px] text-emerald-300 block font-semibold print:text-emerald-700">Trees Needed</span>
                    <span className="text-base font-bold font-mono text-emerald-400 print:text-emerald-700">+{telemetry.trees_needed} Target</span>
                    <span className="text-[10px] text-emerald-500 font-mono">Open: {Math.round(telemetry.plantable_area).toLocaleString()} m²</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-between text-xs text-slate-200 print:bg-emerald-50 print:text-emerald-900">
                  <span>Forecasted AQI Improvement after Target Plantation:</span>
                  <span className="font-bold text-emerald-300 font-mono text-sm print:text-emerald-700">~{telemetry.pollution_drop_pct}% Cleaner Air</span>
                </div>
              </div>

              {/* Municipal Budget & Procurement Estimator */}
              <div className="p-5 rounded-2xl bg-[#0e162a] border border-blue-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <IndianRupee className="w-4 h-4" /> Municipal Procurement & Budget Breakdown
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> ~{budgetData.estimated_completion_days} Days Execution
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block">Total Project Budget</span>
                    <span className="text-2xl font-black text-blue-400 font-mono mt-1">₹{budgetData.total_budget_lakhs} Lakhs</span>
                    <span className="text-[10px] text-slate-500 block font-mono">₹{budgetData.cost_per_tree_inr} / tree all-inclusive</span>
                  </div>

                  <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block">O₂ Yield & CO₂ Sink</span>
                    <span className="text-base font-bold text-emerald-400 font-mono mt-1">+{telemetry.oxygen_yield} kg O₂/yr</span>
                    <span className="text-[10px] text-teal-400 block font-mono">Sink: {telemetry.co2_offset} tons CO₂</span>
                  </div>
                </div>

                <div className="text-xs space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Saplings Procurement ({telemetry.trees_needed} units):</span>
                    <span className="text-white font-bold">₹{budgetData.saplings_procurement_inr.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Protective Guards & Geo-tagging:</span>
                    <span className="text-white font-bold">₹{budgetData.guards_and_infrastructure_inr.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Digging, Labor & Plantation Drive:</span>
                    <span className="text-white font-bold">₹{budgetData.labor_and_plantation_inr.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>1-Year Drip Irrigation & Maintenance:</span>
                    <span className="text-white font-bold">₹{budgetData.maintenance_first_year_inr.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* High Oxygen Native Species */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider print:text-gray-900">High Oxygen Native Species</h3>
                  <span className="text-xs text-emerald-400 font-mono font-semibold print:text-emerald-700">Ranked by O₂ Yield</span>
                </div>

                <div className="space-y-4">
                  {speciesList.map((tree, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#0e162a] border border-slate-800 flex gap-4 hover:border-emerald-500/50 transition print:bg-white print:border-gray-300">
                      <img 
                        src={tree.image} 
                        alt={tree.name} 
                        className="w-24 h-24 rounded-xl object-cover border border-slate-700 shadow-md flex-shrink-0 print:border-gray-200"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-base print:text-gray-900">{tree.name}</h4>
                            <span className="text-xs text-slate-400 italic print:text-gray-500">{tree.scientific}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-300 print:bg-emerald-100 print:text-emerald-800">
                            {tree.badge}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 print:bg-gray-50 print:border-gray-200">
                          <div>
                            <span className="text-slate-400 text-[10px] block print:text-gray-500">O₂ Produced:</span>
                            <span className="font-bold text-emerald-400 font-mono print:text-emerald-700">{tree.oxygen_kg_year || 1800} kg/yr</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block print:text-gray-500">CO₂ Sink:</span>
                            <span className="font-bold text-teal-300 font-mono print:text-teal-700">{tree.co2_sink_kg_year || 950} kg/yr</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block print:text-gray-500">Unit Cost:</span>
                            <span className="font-bold text-blue-400 font-mono print:text-blue-700">₹{tree.cost_per_sapling_inr || 125}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-emerald-400/90 mt-2 font-medium print:text-gray-600">📍 {tree.suitability}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}