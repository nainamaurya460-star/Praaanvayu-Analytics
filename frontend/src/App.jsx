import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet';
import { Wind, Trees, Sparkles, Activity, RefreshCw } from 'lucide-react';

const DEFAULT_BOUNDS = [
  [28.6139, 77.2090],
  [28.6350, 77.2300]
];

export default function App() {
  const [bounds, setBounds] = useState(DEFAULT_BOUNDS);
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState({
    telemetry: { aqi: 185, pm25: 112.5, pm10: 168.0, co_proxy: 510 },
    vegetation: { canopy_pct: 12.4, plantable_area_m2: 4200, total_area_m2: 24000 },
    action_plan: {
      target_deficit_pct: 20.6,
      trees_needed: 295,
      recommended_species: [
        { name: "Peepal (Ficus religiosa)", pm_sink_score: "High", suitability: "Severe AQI corridor" },
        { name: "Neem (Azadirachta indica)", pm_sink_score: "Very High", suitability: "High PM2.5 sink" },
        { name: "Karanj (Pongamia pinnata)", pm_sink_score: "Medium", suitability: "Industrial gas tolerance" }
      ]
    }
  });

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const payload = {
        lat_min: Math.min(bounds[0][0], bounds[1][0]),
        lat_max: Math.max(bounds[0][0], bounds[1][0]),
        lng_min: Math.min(bounds[0][1], bounds[1][1]),
        lng_max: Math.max(bounds[0][1], bounds[1][1])
      };
      const response = await axios.post("http://localhost:8000/api/analyze-zone", payload);
      if (response.data?.status === "success") {
        setAnalysisData(response.data);
      }
    } catch (err) {
      console.warn("Backend not reachable, displaying baseline data.", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#090D16] text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/30 bg-[#0c1222]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Trees className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">
              PraanVayu <span className="text-emerald-400 font-mono text-sm px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">AI</span>
            </h1>
            <p className="text-xs text-slate-400">Targeted Green Cover & Carbon Sink Deficit Engine</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Analyzing Satellite Grid..." : "Scan Selected Grid"}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-3/5 h-full relative border-r border-slate-800">
          <MapContainer center={[28.6245, 77.2195]} zoom={14} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <Rectangle bounds={bounds} pathOptions={{ color: '#10B981', weight: 2, fillOpacity: 0.25, dashArray: '4' }} />
          </MapContainer>
        </div>

        <div className="w-2/5 h-full overflow-y-auto p-6 space-y-6 bg-slate-950/60">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Air Quality (AQI)</span>
                <Wind className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono">{analysisData.telemetry.aqi}</div>
              <p className="text-xs text-slate-500 mt-1">PM2.5: {analysisData.telemetry.pm25} µg/m³</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Canopy Cover</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">{analysisData.vegetation.canopy_pct}%</div>
              <p className="text-xs text-slate-500 mt-1">Target Deficit: {analysisData.action_plan.target_deficit_pct}%</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/40">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> Recommended Plantation Target
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-white font-mono">{analysisData.action_plan.trees_needed}</span>
              <span className="text-emerald-300 font-medium">Native Saplings</span>
            </div>
            <div className="mt-3 text-xs text-slate-400 flex justify-between border-t border-emerald-900/40 pt-3">
              <span>Plantable Open Ground:</span>
              <span className="font-mono text-emerald-300 font-bold">{analysisData.vegetation.plantable_area_m2} m²</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Priority Native Species</h3>
            <div className="space-y-2.5">
              {analysisData.action_plan.recommended_species.map((tree, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{tree.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{tree.suitability}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-950 border border-emerald-700 text-emerald-300">
                    {tree.pm_sink_score || 'High'} Sink
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}