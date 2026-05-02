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

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (aqi <= 100) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    if (aqi <= 200) return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-[Inter]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            Environmental Intelligence Network
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Analyze hyper-local air quality stations and retrieve algorithmic biomitigation strategies.
          </p>
        </div>

        {/* Control Panel */}
        <div className="max-w-xl mx-auto bg-[#131A2A] border border-slate-800 rounded-2xl p-6 shadow-2xl mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter State or City (e.g., Delhi)"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setSharedLocation(e.target.value);
              }}
              className="flex-1 bg-[#1A2235] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              onClick={fetchAQI}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Scanning..." : "Analyze AQI"}
            </button>
          </div>
          
          {recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center animate-pulse">
              <span className="text-sm text-slate-500">Ready to take action?</span>
              <button
                onClick={() => (window.location.href = "/reduceaqi")}
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
              >
                Go to Reduction Engine →
              </button>
            </div>
          )}
        </div>

        {/* AQI Grid */}
        {recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((station, idx) => {
              const aqiValue = Number(station.aqi ?? station.pollutants?.AQI ?? 0);
              return (
                <div
                  key={idx}
                  className="bg-[#131A2A] border border-slate-800 rounded-2xl p-6 transition hover:border-slate-700 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6 gap-4">
                    <h2 className="text-lg font-semibold text-white leading-tight">
                      {String(station.station_name)}
                    </h2>
                    <div className={`px-3 py-1.5 rounded-lg border font-bold text-lg whitespace-nowrap ${getAqiColor(aqiValue)}`}>
                      AQI {aqiValue || "N/A"}
                    </div>
                  </div>

                  {/* Pollutants Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-6 bg-[#0B0F19] rounded-xl p-4 border border-slate-800/50">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 font-bold mb-1">CO</span>
                      <span className="text-slate-200">{station.pollutants?.co ? String(station.pollutants.co) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 font-bold mb-1">NO₂</span>
                      <span className="text-slate-200">{station.pollutants?.no2 ? String(station.pollutants.no2) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 font-bold mb-1">O₃</span>
                      <span className="text-slate-200">{station.pollutants?.o3 ? String(station.pollutants.o3) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 font-bold mb-1">PM2.5</span>
                      <span className="text-slate-200">{station.pollutants?.pm2_5 ? String(station.pollutants.pm2_5) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 font-bold mb-1">PM10</span>
                      <span className="text-slate-200">{station.pollutants?.pm10 ? String(station.pollutants.pm10) : "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 font-bold mb-1">SO₂</span>
                      <span className="text-slate-200">{station.pollutants?.so2 ? String(station.pollutants.so2) : "--"}</span>
                    </div>
                  </div>

                  {/* Interventions */}
                  {station.tree_groups && Object.keys(station.tree_groups).length > 0 && (
                    <div className="mt-auto">
                      <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                        Suggested Biomitigation
                      </h3>
                      <div className="flex flex-col gap-2">
                        {Object.keys(station.tree_groups).slice(0, 2).map((group) => {
                          const g = station.tree_groups![group];
                          return (
                            <div key={group} className="flex justify-between items-center p-3 rounded-xl bg-[#1A2235] border border-slate-700/50">
                              <div>
                                <div className="text-sm text-slate-200 font-medium">{g.tree_name}</div>
                                <div className="text-[11px] text-slate-400 italic">{g.scientific_name}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-emerald-400 font-bold">-{g.benefits.avg_reduction_percent}% AQI</div>
                                <div className="text-[11px] text-slate-400">Target: {g.benefits.new_AQI}</div>
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
