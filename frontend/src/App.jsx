import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Rectangle, useMapEvents, useMap } from 'react-leaflet';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Wind, Trees, Droplets, Thermometer, Sparkles, 
  ShieldCheck, ChevronRight, Activity, MapPin, Search, Loader2, Download, IndianRupee, Clock, Layers
} from 'lucide-react';

const LANDMARK_PRESETS = [
  { name: "Jal Mahal", lat: 26.9537, lng: 75.8463, zoom: 15 },
  { name: "Kukas", lat: 27.0338, lng: 75.8877, zoom: 14 },
  { name: "Pink City", lat: 26.9220, lng: 75.8267, zoom: 15 },
  { name: "Mansarovar", lat: 26.8584, lng: 75.7675, zoom: 15 }
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

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onSelectArea }) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const offset = 0.008; 
      const newBounds = [
        [lat - offset, lng - offset],
        [lat + offset, lng + offset]
      ];
      onSelectArea(newBounds, lat, lng, `Target (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`);
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeLocationName, setActiveLocationName] = useState("Jal Mahal, Jaipur");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('diagnostics');
  
  const [telemetry, setTelemetry] = useState({
    aqi: 218,
    aqi_status: "Very Unhealthy (Severe)",
    pm25: 134.5,
    humidity: 38,
    temp: 34,
    canopy_pct: 14.8,
    plantable_area: 14200,
    total_area: 48000,
    current_trees: 112,
    trees_needed: 620,
    pollution_drop_pct: 38,
    oxygen_yield: "12,09,000",
    co2_offset: "651.0"
  });

  const [budgetData, setBudgetData] = useState({
    cost_per_tree_inr: 775,
    total_budget_inr: 480500,
    total_budget_lakhs: 4.81,
    saplings_procurement_inr: 77500,
    guards_and_infrastructure_inr: 198400,
    labor_and_plantation_inr: 93000,
    maintenance_first_year_inr: 111600,
    estimated_completion_days: 14
  });

  const [speciesList, setSpeciesList] = useState(DEFAULT_SPECIES);

  const [chartData, setChartData] = useState([
    { time: '06:00', aqi: 170, pm25: 98 },
    { time: '10:00', aqi: 245, pm25: 155 },
    { time: '14:00', aqi: 218, pm25: 134 },
    { time: '18:00', aqi: 260, pm25: 172 },
    { time: '22:00', aqi: 275, pm25: 185 },
  ]);

  const handleSelectArea = async (newBounds, lat, lng, locationLabel) => {
    setBounds(newBounds);
    setProcessing(true);
    if (locationLabel) setActiveLocationName(locationLabel);

    try {
      const payload = {
        lat_min: Math.min(newBounds[0][0], newBounds[1][0]),
        lat_max: Math.max(newBounds[0][0], newBounds[1][0]),
        lng_min: Math.min(newBounds[0][1], newBounds[1][1]),
        lng_max: Math.max(newBounds[0][1], newBounds[1][1])
      };
      const res = await axios.post("http://localhost:8000/api/analyze-zone", payload);
      if (res.data?.status === "success") {
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

        if (d.action_plan.budget_breakdown) {
          setBudgetData(d.action_plan.budget_breakdown);
        }
        if (d.telemetry.hourly_curve && d.telemetry.hourly_curve.length > 0) {
          setChartData(d.telemetry.hourly_curve);
        }
        if (d.action_plan.recommended_species && d.action_plan.recommended_species.length > 0) {
          setSpeciesList(d.action_plan.recommended_species);
        }
      }
    } catch (e) {
      console.warn("Backend local fallback active.", e);
    } finally {
      setTimeout(() => setProcessing(false), 500);
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
        setMapZoom(15);
        const offset = 0.008;
        const newBounds = [
          [lat - offset, lng - offset],
          [lat + offset, lng + offset]
        ];
        handleSelectArea(newBounds, lat, lng, displayName);
        setSearchQuery("");
      } else {
        alert("Location not found! Try another landmark or area name.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
      alert("Error finding location. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const jumpToLocation = (preset) => {
    setMapCenter([preset.lat, preset.lng]);
    setMapZoom(preset.zoom);
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
              placeholder="Search any place (e.g. Kukas, Jal Mahal, Connaught Place)..."
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
            <Rectangle bounds={bounds} pathOptions={{ color: '#10B981', weight: 2.5, fillOpacity: 0.25, dashArray: '5' }} />
            <MapController center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onSelectArea={handleSelectArea} />
          </MapContainer>

          <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs text-slate-200 shadow-xl flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Active: <span className="font-bold text-emerald-400">{activeLocationName}</span>
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

              {/* Native Species Recommendations */}
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

                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 print:bg-gray-50 print:border-gray-200">
                          <div>
                            <span className="text-slate-400 text-[10px] block print:text-gray-500">O₂ Produced:</span>
                            <span className="font-bold text-emerald-400 font-mono print:text-emerald-700">{tree.oxygen_kg_year || 1800} kg/year</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block print:text-gray-500">CO₂ Absorbed:</span>
                            <span className="font-bold text-teal-300 font-mono print:text-teal-700">{tree.co2_sink_kg_year || 950} kg/year</span>
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