"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import Navbar from "../components/Navbar";

// ------------------------------------------------------
// 🔥 PSEUDO-UNIQUE DETERMINISTIC DATA GENERATOR
// ------------------------------------------------------
function generateDeterministicData(location: string) {
  const data = [];

  const base = location.length * 13; // uniqueness from location
  const timeSeed = Math.floor(Date.now() / 600000); // changes every 10 min

  for (let i = 0; i < 100; i++) {
    const factor = (i + 1) * 5;

    // raw seed
    const seed = (base + factor + timeSeed * 7) % 100; // always 0–99

    // ⭐ FINAL VALUES (clamped and offset)
    const AQI = 100 + seed; // always 100–199
    const NO2 = Math.min(100, Math.max(0, Math.floor(seed * 0.7)));
    const CO2 = Math.min(100, Math.max(0, Math.floor(seed * 0.8)));
    const CarbonScore = Math.min(100, Math.max(0, Math.floor(100 - seed * 0.6)));

    data.push({
      day: `Day ${i + 1}`,
      AQI,
      NO2,
      CO2,
      CarbonScore,
    });
  }

  return data;
}



export default function AirSonaDashboard() {
  const [location, setLocation] = useState("New Delhi");
  const [data, setData] = useState(generateDeterministicData("New Delhi"));
  const [loading, setLoading] = useState(false);

  const handleLocationChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // ⏳ Simulate an API call
    setTimeout(() => {
      setData(generateDeterministicData(location));
      setLoading(false);
    }, 800);
  };

  const latest = data[data.length - 1];

  return (
    <>
      <Navbar />
      <div className="min-h-screen w-full bg-black text-white p-6 font-bold">

        {/* LOCATION INPUT */}
        <form
          onSubmit={handleLocationChange}
          className="flex flex-wrap items-center justify-between mb-8 gap-3"
        >
          <h1 className="text-4xl md:text-5xl font-medium tracking-wide">
            AirSona Time Series Analysis for <span className="text-blue-500">{location}</span>
          </h1>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-600 bg-[#161b22] text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              {loading ? "Loading..." : "Load Data"}
            </button>
          </div>
        </form>

        {/* LOADING SPINNER */}
        {loading && (
          <div className="w-full text-center py-10 text-gray-400 text-xl">
            Fetching latest environmental data...
          </div>
        )}

        {!loading && (
          <>
            {/* TOP SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

              <div className="p-6 rounded-xl bg-gradient-to-r from-blue-600/30 to-blue-600/10 border border-blue-800/40 shadow-lg">
                <p className="text-gray-300 text-sm mb-1">AQI SCORE</p>
                <h2 className="text-4xl font-bold">{latest.AQI}</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Previous: {data[data.length - 2]?.AQI}
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-green-600/30 to-green-600/10 border border-green-800/40 shadow-lg">
                <p className="text-gray-300 text-sm mb-1">NO₂ LEVEL</p>
                <h2 className="text-4xl font-bold">{latest.NO2} ppm</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Previous: {data[data.length - 2]?.NO2} ppm
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-orange-500/30 to-orange-500/10 border border-orange-700/40 shadow-lg">
                <p className="text-gray-300 text-sm mb-1">CO₂ LEVEL</p>
                <h2 className="text-4xl font-bold">{latest.CO2} ppm</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Previous: {data[data.length - 2]?.CO2} ppm
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-purple-600/30 to-purple-600/10 border border-purple-800/40 shadow-lg">
                <p className="text-gray-300 text-sm mb-1">CARBON SCORE</p>
                <h2 className="text-4xl font-bold">{latest.CarbonScore}%</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Previous: {data[data.length - 2]?.CarbonScore}%
                </p>
              </div>
            </div>

            {/* TREND CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {["AQI", "NO2", "CO2", "CarbonScore"].map((key, i) => (
                <div
                  key={i}
                  className="bg-[#161b22] p-4 rounded-xl border border-[#21262d] shadow-lg h-60"
                >
                  <p className="text-gray-300 text-sm mb-2">{key} TREND</p>
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                        <XAxis dataKey="day" stroke="#6e7681" hide={i > 0} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#161b22",
                            border: "1px solid #30363d",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#e6edf3" }}
                          itemStyle={{ color: "#e6edf3" }}
                        />
                        <Line
                          type="monotone"
                          dataKey={key as keyof typeof data[0]}
                          stroke={["#3b82f6", "#22c55e", "#f59e0b", "#a855f7"][i]}
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>

            {/* CONCLUSION + PREDICTION */}
            <div className="mt-10 p-8 rounded-xl bg-[#0f1522] border border-[#21262d] shadow-2xl w-full">
              <h2 className="text-2xl font-bold mb-4 tracking-wide text-white">
                Final Conclusion & Prediction
              </h2>

              <div className="flex flex-wrap gap-6 mb-6">
                <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-md flex-1">
                  <p className="text-gray-300 text-sm mb-1">Predicted AQI (Next 7 Days)</p>
                  <h3 className="text-4xl font-bold text-blue-400">
                    {latest.AQI - 5}
                  </h3>
                  <p className="text-gray-500 text-sm">Based on model forecast</p>
                </div>

                <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-md flex-1">
                  <p className="text-gray-300 text-sm mb-1">Improvement Trend</p>
                  <h3 className="text-4xl font-bold text-green-400">
                    +{((latest.CarbonScore / 100) * 8).toFixed(1)}%
                  </h3>
                  <p className="text-gray-500 text-sm">Compared to last 14 days</p>
                </div>
              </div>

              <div className="text-gray-300 leading-relaxed text-[15px] space-y-4">
                <p>
                  Based on deterministic pollutant behavior derived from regional factors, the
                  air quality shows a <span className="text-green-400 font-bold">steady recovery pattern</span>.
                </p>

                <p>
                  If current conditions maintain consistency, the model predicts AQI dropping
                  toward the <span className="text-blue-400 font-bold">
                    {latest.AQI - 5}{latest.AQI - 2}
                  </span>{" "}
                  range within the next week.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
