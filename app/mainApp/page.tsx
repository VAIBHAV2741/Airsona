"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import { setSharedLocation } from "../utils/locationVar";

interface AQIStation {
  station_name?: string | number;
  aqi?: string | number;
  pollutants?: {
    AQI?: string | number;
    co?: string | number;
    no2?: string | number;
    o3?: string | number;
    pm2_5?: string | number;
    pm10?: string | number;
    so2?: string | number;
    [key: string]: unknown;
  };
  tree_groups?: Record<string, any>;
}

export default function MainAppPage() 
{
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AQIStation[]>([]);

  const fetchAQI = async () => {
    if (!location) return alert("Enter a state or city first!");
    setLoading(true);

    try {
      const res = await fetch(`/api/airsona?q=${encodeURIComponent(location)}`);
      if (!res.ok) throw new Error("Failed to fetch API");

      const data = await res.json();
      console.log("API Response:", data);

      if (data.status !== "success" || !data.recommendations) {
        alert("No data returned from API.");
        setRecommendations([]);
        return;
      }

      setRecommendations(data.recommendations);
      localStorage.setItem("airsona_location", location);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while fetching data!");
    } finally {
      setLoading(false);
    }
  };

  const getAqiColorClasses = (aqi: number) => {
    if (aqi <= 50) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (aqi <= 100) return "bg-lime-500/10 text-lime-400 border border-lime-500/20";
    if (aqi <= 200) return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    if (aqi <= 300) return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
    return "bg-red-500/10 text-red-400 border border-red-500/20";
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-[Inter] font-light selection:bg-emerald-500/30">
      <Navbar />

      <main className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-12 mt-8">
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-white mb-4">
            Environmental <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Intelligence Network</span>
          </h1>
          <p className="text-slate-400 font-light max-w-2xl text-sm md:text-base">
            Analyze hyper-local air quality stations and retrieve algorithmic biomitigation strategies.
          </p>
        </div>

        {/* Control Panel */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter State or City (e.g., Delhi)"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setSharedLocation(e.target.value);
              }}
              className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-full px-6 py-3 outline-none focus:border-emerald-500/50 transition-colors font-light placeholder:text-slate-500 shadow-sm"
            />
            <button
              onClick={fetchAQI}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-medium px-8 py-3 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 min-w-[160px]"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>✨ Analyze AQI</>
              )}
            </button>
          </div>
          
          {recommendations.length > 0 && (
            <div className="mt-6 flex justify-center animate-pulse">
              <button
                onClick={() => (window.location.href = "/reduceaqi")}
                className="bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] px-6 py-2 rounded-full text-emerald-400 hover:text-emerald-300 text-sm font-light transition-all flex items-center gap-2"
              >
                <span>Ready to take action?</span>
                <span className="font-medium">Go to Reduction Engine →</span>
              </button>
            </div>
          )}
        </div>

        {/* AQI Grid */}
        {recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations.map((station, idx) => {
              const aqiValue = Number(station.aqi ?? station.pollutants?.AQI ?? 0);
              return (
                <div
                  key={idx}
                  className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 transition-all hover:bg-white/[0.04] flex flex-col group"
                >
                  <div className="flex justify-between items-start mb-6 gap-4">
                    <h2 className="text-lg font-light text-white leading-tight flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-emerald-500 transition-colors"></span>
                      {String(station.station_name)}
                    </h2>
                    <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium whitespace-nowrap ${getAqiColorClasses(aqiValue)}`}>
                      AQI {aqiValue || "N/A"}
                    </div>
                  </div>

                  {/* Pollutants Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-8 bg-[#0a0a0a] rounded-2xl p-5 border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1.5">CO</span>
                      <span className="text-white font-light text-sm">{station.pollutants?.co ? String(station.pollutants.co) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1.5">NO₂</span>
                      <span className="text-white font-light text-sm">{station.pollutants?.no2 ? String(station.pollutants.no2) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1.5">O₃</span>
                      <span className="text-white font-light text-sm">{station.pollutants?.o3 ? String(station.pollutants.o3) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1.5">PM2.5</span>
                      <span className="text-white font-light text-sm">{station.pollutants?.pm2_5 ? String(station.pollutants.pm2_5) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1.5">PM10</span>
                      <span className="text-white font-light text-sm">{station.pollutants?.pm10 ? String(station.pollutants.pm10) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1.5">SO₂</span>
                      <span className="text-white font-light text-sm">{station.pollutants?.so2 ? String(station.pollutants.so2) : "--"}</span>
                    </div>
                  </div>

                  {/* Interventions */}
                  {station.tree_groups && Object.keys(station.tree_groups).length > 0 && (
                    <div className="mt-auto">
                      <h3 className="text-[10px] font-medium text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <span>🌱</span> Suggested Biomitigation
                      </h3>
                      <div className="flex flex-col gap-2.5">
                        {Object.keys(station.tree_groups).slice(0, 2).map((group) => {
                          const g = station.tree_groups![group];
                          return (
                            <div key={group} className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                              <div>
                                <div className="text-sm text-white font-medium">{g.tree_name}</div>
                                <div className="text-xs text-slate-500 font-light mt-0.5">{g.scientific_name}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 justify-end">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                  </svg>
                                  {g.benefits.avg_reduction_percent}% AQI
                                </div>
                                <div className="text-xs text-slate-500 font-light mt-0.5">Target: {g.benefits.new_AQI}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
