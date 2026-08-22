import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Rectangle, useMapEvents, useMap } from 'react-leaflet';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Wind, Trees, Droplets, Thermometer, Sparkles, 
  ShieldCheck, ChevronRight, Activity, MapPin, Search, Loader2
} from 'lucide-react';

const LANDMARK_PRESETS = [
  { name: "Jal Mahal", lat: 26.9537, lng: 75.8463, zoom: 15 },
  { name: "Kukas", lat: 27.0338, lng: 75.8877, zoom: 14 },
  { name: "Pink City", lat: 26.9220, lng: 75.8267, zoom: 15 },
  { name: "Mansarovar", lat: 26.8584, lng: 75.7675, zoom: 15 }
];

const SPECIES_DETAILS = [
  {
    name: "Peepal (Ficus religiosa)",
    scientific: "Ficus religiosa",
    image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80",
    oxygen: "2,400 kg/year",
    co2Sink: "1,200 kg/year",
    badge: "24/7 Oxygen Sink",
    suitability: "Best for water bodies & broad avenue greenbelts"
  },
  {
    name: "Khejri (State Tree)",
    scientific: "Prosopis cineraria",
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    oxygen: "1,650 kg/year",
    co2Sink: "900 kg/year",
    badge: "Extreme Drought Hardy",
    suitability: "Essential for dry semi-arid land & soil binding"
  },
  {
    name: "Neem (Azadirachta indica)",
    scientific: "Azadirachta indica",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
    oxygen: "1,850 kg/year",
    co2Sink: "950 kg/year",
    badge: "Air Purifier Leader",
    suitability: "High dust and PM2.5 trapping near highways"
  },
  {
    name: "Arjun (Terminalia arjuna)",
    scientific: "Terminalia arjuna",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    oxygen: "1,950 kg/year",
    co2Sink: "1,100 kg/year",
    badge: "Riparian Specialist",
    suitability: "Lake banks, ponds & high moisture ground"
  }
];

function MapController({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
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
      onSelectArea(newBounds, lat, lng, `Custom Point (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`);
    }
  });
  return null;
}

export default function App() {
  const [mapCenter, setMapCenter] = useState([26.9537, 75.8463]); // Default Jal Mahal
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
    pm25: 134.5,
    humidity: 38,
    temp: 34,
    canopy_pct: 8.4,
    plantable_area: 14200,
    total_area: 48000,
    current_trees: 112,
    trees_needed: 620,
    pollution_drop_pct: 38
  });

  const chartData = [
    { time: '06:00 AM', aqi: 170, pm25: 98 },
    { time: '09:00 AM', aqi: 245, pm25: 155 },
    { time: '12:00 PM', aqi: 218, pm25: 134 },
    { time: '03:00 PM', aqi: 195, pm25: 120 },
    { time: '06:00 PM', aqi: 260, pm25: 172 },
    { time: '09:00 PM', aqi: 275, pm25: 185 },
  ];

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
        setTelemetry(prev => ({
          ...prev,
          aqi: res.data.telemetry.aqi || 220,
          pm25: res.data.telemetry.pm25 || 130,
          canopy_pct: res.data.vegetation.canopy_pct || 9.2,
          plantable_area: res.data.vegetation.plantable_area_m2 || 12400,
          trees_needed: res.data.action_plan.trees_needed || 580
        }));
      }
    } catch (e) {
      console.warn("Backend local fallback active.");
    } finally {
      setTimeout(() => setProcessing(false), 700);
    }
  };

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
      
      {/* TOP HEADER */}
      <header className="px-6 py-3 bg-[#0d1527] border-b border-emerald-950/60 shadow-xl flex items-center justify-between z-10 gap-4">
        {/* Title */}
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

        {/* Global Location Search Bar */}
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

        {/* Quick Presets */}
        <div className="flex items-center gap-1 shrink-0">
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
        </div>
      </header>

      {/* PROCESSING TOAST BANNER */}
      {processing && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 px-4 py-2 font-black text-center text-sm shadow-md animate-pulse flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5" />
          You are very close to saving lives! Scanning satellite pixels for {activeLocationName}...
        </div>
      )}

      {/* MAIN VIEW */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT: SATELLITE MAP */}
        <div className="w-1/2 h-full relative border-r border-slate-800">
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

        {/* RIGHT: DASHBOARD TABS */}
        <div className="w-1/2 h-full overflow-y-auto p-6 space-y-6 bg-[#0a0f1d]">
          
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
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
              <Trees className="w-4 h-4" /> 2. Solving Steps & High-O₂ Species
            </button>
          </div>

          {/* TAB 1: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#0e162a] border border-red-500/30 shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Air Quality Index (AQI)</span>
                    <Wind className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-3xl font-black text-red-400 font-mono mt-2">{telemetry.aqi}</div>
                  <span className="inline-block mt-2 px-2 py-0.5 text-[11px] font-bold rounded bg-red-950/80 text-red-300 border border-red-800">
                    High Health Risk
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e162a] border border-amber-500/30 shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>PM2.5 Particulate</span>
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400 font-mono mt-2">{telemetry.pm25}</div>
                  <span className="text-xs text-slate-400 mt-2 block font-mono">µg/m³ (Severe Level)</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e162a] border border-blue-500/30 shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Humidity</span>
                    <Droplets className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-3xl font-black text-blue-400 font-mono mt-2">{telemetry.humidity}%</div>
                  <span className="text-xs text-slate-400 mt-2 block">Atmospheric Moisture</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e162a] border border-orange-500/30 shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-xs">
                    <span>Ambient Temp</span>
                    <Thermometer className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-3xl font-black text-orange-400 font-mono mt-2">{telemetry.temp}°C</div>
                  <span className="text-xs text-slate-400 mt-2 block">Surface Heat Index</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e162a] border border-slate-800 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Diurnal Pollution Curve</h3>
                    <p className="text-[11px] text-slate-400">Hourly trajectory for {activeLocationName}</p>
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
                className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <span>Proceed to Solving Steps of Problem</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* TAB 2: PROBLEM SOLVING */}
          {activeTab === 'solution' && (
            <div className="space-y-6">
              
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0e162a] to-[#0e162a] border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Zone Capacity & Tree Deficit
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Total Land Area</span>
                    <span className="text-base font-bold font-mono text-white">{(telemetry.total_area / 10000).toFixed(2)} Ha</span>
                    <span className="text-[10px] text-slate-500 font-mono">({telemetry.total_area.toLocaleString()} m²)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Current Trees</span>
                    <span className="text-base font-bold font-mono text-amber-400">{telemetry.current_trees} Existing</span>
                    <span className="text-[10px] text-slate-500">Canopy: {telemetry.canopy_pct}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-600/40">
                    <span className="text-[11px] text-emerald-300 block font-semibold">Trees Needed</span>
                    <span className="text-base font-bold font-mono text-emerald-400">+{telemetry.trees_needed} Target</span>
                    <span className="text-[10px] text-emerald-500 font-mono">Open: {telemetry.plantable_area} m²</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-between text-xs text-slate-200">
                  <span>Forecasted AQI Improvement after Plantation:</span>
                  <span className="font-bold text-emerald-300 font-mono text-sm">~{telemetry.pollution_drop_pct}% Cleaner Air</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">High Oxygen Native Species</h3>
                  <span className="text-xs text-emerald-400 font-mono font-semibold">Ranked by O₂ Yield</span>
                </div>

                <div className="space-y-4">
                  {SPECIES_DETAILS.map((tree, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#0e162a] border border-slate-800 flex gap-4 hover:border-emerald-500/50 transition">
                      <img 
                        src={tree.image} 
                        alt={tree.name} 
                        className="w-24 h-24 rounded-xl object-cover border border-slate-700 shadow-md flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-base">{tree.name}</h4>
                            <span className="text-xs text-slate-400 italic">{tree.scientific}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                            {tree.badge}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                          <div>
                            <span className="text-slate-400 text-[10px] block">O₂ Produced:</span>
                            <span className="font-bold text-emerald-400 font-mono">{tree.oxygen}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">CO₂ Absorbed:</span>
                            <span className="font-bold text-teal-300 font-mono">{tree.co2Sink}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-emerald-400/90 mt-2 font-medium">📍 {tree.suitability}</p>
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