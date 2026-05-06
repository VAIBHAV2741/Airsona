"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Area, AreaChart, Legend,
} from "recharts";
import Navbar from "../components/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────
interface City { city: string; state: string; lat: number; lon: number; }
interface Historical {
  date: string; aqi: number; category: string; dominant: string;
  pm25: number; pm10: number; no2: number; o3: number; co: number; so2: number;
}
interface Forecast {
  date: string; aqi: number; aqi_lower: number; aqi_upper: number; category: string;
}
interface DiurnalPoint {
  hour: number; pm25: number; pm10: number; no2: number; o3: number; aqi: number;
}
interface ApiResponse {
  city: string;
  coordinates: { lat: number; lon: number };
  current: {
    aqi: number; category: string; dominant: string; station: string;
    time: string; pollutants: { pm25: number; pm10: number; no2: number; o3: number; co: number; so2: number };
  };
  historical: Historical[];
  forecast: Forecast[];
  diurnal: DiurnalPoint[];
  model: { algorithm: string; training_days: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function aqiColor(aqi: number) {
  if (aqi <= 50) return "#22c55e";
  if (aqi <= 100) return "#eab308";
  if (aqi <= 150) return "#f97316";
  if (aqi <= 200) return "#ef4444";
  if (aqi <= 300) return "#a855f7";
  return "#7f1d1d";
}
function aqiLabel(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function TimeSeriesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [selected, setSelected] = useState<City | null>(null);
  const [customCity, setCustomCity] = useState("");
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [forecastDays, setForecastDays] = useState(7);

  // Load cities list
  useEffect(() => {
    fetch("/api/india-cities")
      .then((r) => r.json())
      .then((d: City[]) => {
        setCities(d);
        setSelected(d[0]);
      })
      .catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    const city = useCustom ? customCity : selected?.city;
    const lat  = useCustom ? customLat  : selected?.lat?.toString();
    const lon  = useCustom ? customLon  : selected?.lon?.toString();
    if (!city || !lat || !lon) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/timeseries?city=${encodeURIComponent(city)}&lat=${lat}&lon=${lon}&days=${days}&forecast_days=${forecastDays}`
      );
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [selected, useCustom, customCity, customLat, customLon, days, forecastDays]);

  // Auto-fetch when city selection changes
  useEffect(() => {
    if (selected && !useCustom) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, days, forecastDays]);

  // Build merged chart data (historical + forecast)
  const chartData = data
    ? [
        ...data.historical.map((h) => ({
          date: fmtDate(h.date),
          aqi: h.aqi,
          pm25: h.pm25,
          pm10: h.pm10,
          no2: h.no2,
          o3: h.o3,
          type: "historical" as const,
        })),
        ...data.forecast.map((f) => ({
          date: fmtDate(f.date),
          aqi: f.aqi,
          aqi_lower: f.aqi_lower,
          aqi_upper: f.aqi_upper,
          pm25: null,
          pm10: null,
          no2: null,
          o3: null,
          type: "forecast" as const,
        })),
      ]
    : [];

  const current = data?.current;
  const lastHist = data?.historical[data.historical.length - 1];
  const avgAqi = data
    ? Math.round(data.historical.reduce((s, h) => s + h.aqi, 0) / data.historical.length)
    : 0;

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "#060912", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", padding: "80px 24px 40px" }}>

        {/* ── Header ── */}
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>
              Air Quality{" "}
              <span style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Time Series
              </span>
            </h1>
            <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
              Powered by Holt-Winters ML · Real data via Open-Meteo + WAQI
            </p>
          </div>

          {/* ── Controls ── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 32, alignItems: "flex-end" }}>
            {/* City selector */}
            {!useCustom && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>City</label>
                <select
                  value={selected?.city || ""}
                  onChange={(e) => setSelected(cities.find((c) => c.city === e.target.value) || null)}
                  style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", padding: "8px 12px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                >
                  {cities.map((c) => (
                    <option key={c.city} value={c.city}>{c.city}, {c.state}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom city inputs */}
            {useCustom && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>City Name</label>
                  <input value={customCity} onChange={(e) => setCustomCity(e.target.value)} placeholder="e.g. Pune"
                    style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", padding: "8px 12px", borderRadius: 8, fontSize: 14, width: 140 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Latitude</label>
                  <input value={customLat} onChange={(e) => setCustomLat(e.target.value)} placeholder="18.52"
                    style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", padding: "8px 12px", borderRadius: 8, fontSize: 14, width: 100 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Longitude</label>
                  <input value={customLon} onChange={(e) => setCustomLon(e.target.value)} placeholder="73.85"
                    style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", padding: "8px 12px", borderRadius: 8, fontSize: 14, width: 100 }} />
                </div>
              </>
            )}

            {/* Days slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>History: {days}d</label>
              <input type="range" min={7} max={92} value={days} onChange={(e) => setDays(+e.target.value)}
                style={{ width: 120, accentColor: "#3b82f6" }} />
            </div>

            {/* Forecast days */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Forecast: {forecastDays}d</label>
              <input type="range" min={1} max={14} value={forecastDays} onChange={(e) => setForecastDays(+e.target.value)}
                style={{ width: 100, accentColor: "#8b5cf6" }} />
            </div>

            <button
              onClick={() => setUseCustom((v) => !v)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #1e293b", background: useCustom ? "#1e293b" : "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}
            >
              {useCustom ? "← Use Preset" : "Custom City"}
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              style={{ padding: "9px 22px", borderRadius: 8, background: loading ? "#1e3a5f" : "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s" }}
            >
              {loading ? "Fetching…" : "Analyze"}
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{ background: "#1a0a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "14px 20px", marginBottom: 24, color: "#fca5a5", fontSize: 14 }}>
              ⚠ {error}
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
              <div style={{ width: 40, height: 40, border: "3px solid #1e293b", borderTop: "3px solid #3b82f6", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p style={{ margin: 0 }}>Fetching real-time air quality data…</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155" }}>First load may take ~20s (cold start)</p>
            </div>
          )}

          {/* ── Dashboard ── */}
          {!loading && data && (
            <>
              {/* Current AQI banner */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
                <div style={{ gridColumn: "span 2", background: "#0f172a", border: `1px solid ${aqiColor(current!.aqi)}44`, borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ fontSize: 64, fontWeight: 800, color: aqiColor(current!.aqi), lineHeight: 1 }}>{current!.aqi}</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Live AQI · {current!.station}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: aqiColor(current!.aqi) }}>{current!.category}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Dominant: {current!.dominant.toUpperCase()} · {current!.time}</div>
                  </div>
                </div>

                {[
                  { label: "PM2.5", value: `${current!.pollutants.pm25} µg/m³`, color: "#3b82f6" },
                  { label: "PM10",  value: `${current!.pollutants.pm10} µg/m³`,  color: "#f59e0b" },
                  { label: "NO₂",   value: `${current!.pollutants.no2} µg/m³`,   color: "#22c55e" },
                  { label: "O₃",    value: `${current!.pollutants.o3} µg/m³`,    color: "#8b5cf6" },
                  { label: "CO",    value: `${current!.pollutants.co} µg/m³`,    color: "#ef4444" },
                  { label: "SO₂",   value: `${current!.pollutants.so2} µg/m³`,   color: "#06b6d4" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}

                {/* Summary stats */}
                {[
                  { label: "30d Avg AQI", value: avgAqi, color: aqiColor(avgAqi) },
                  { label: "Forecast (next 7d avg)", value: Math.round(data.forecast.reduce((s,f)=>s+f.aqi,0)/data.forecast.length), color: "#8b5cf6" },
                  { label: "Model", value: data.model.algorithm, color: "#3b82f6", isText: true },
                ].map(({ label, value, color, isText }) => (
                  <div key={label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: isText ? 16 : 26, fontWeight: 700, color }}>{value}</div>
                    {!isText && <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{aqiLabel(value as number)}</div>}
                  </div>
                ))}
              </div>

              {/* AQI Historical + Forecast chart */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>AQI — Historical + Forecast</h2>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 24, height: 2, background: "#3b82f6", display: "inline-block" }} /> Historical</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 24, height: 2, background: "#a855f7", display: "inline-block", borderTop: "2px dashed #a855f7" }} /> Forecast</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#334155" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis stroke="#334155" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 13 }}
                      labelStyle={{ color: "#94a3b8" }}
                      itemStyle={{ color: "#e2e8f0" }}
                    />
                    <ReferenceLine x={fmtDate(data.historical[data.historical.length - 1].date)} stroke="#334155" strokeDasharray="4 4" label={{ value: "Today", fill: "#475569", fontSize: 11 }} />
                    <Area type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} fill="url(#histGrad)" dot={false} name="AQI (hist)" connectNulls={false} />
                    <Area type="monotone" dataKey="aqi" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 3" fill="url(#fcGrad)" dot={false} name="AQI (forecast)" connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Pollutant trend charts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginBottom: 24 }}>
                {[
                  { key: "pm25", label: "PM2.5 (µg/m³)", color: "#3b82f6" },
                  { key: "pm10", label: "PM10 (µg/m³)",  color: "#f59e0b" },
                  { key: "no2",  label: "NO₂ (µg/m³)",   color: "#22c55e" },
                  { key: "o3",   label: "O₃ (µg/m³)",    color: "#8b5cf6" },
                ].map(({ key, label, color }) => (
                  <div key={key} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "16px 20px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{label}</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={data.historical.map(h => ({ date: fmtDate(h.date), value: h[key as keyof Historical] as number }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" hide />
                        <YAxis stroke="#334155" tick={{ fontSize: 10 }} width={32} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#94a3b8" }} />
                        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} name={label} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>

              {/* Diurnal pattern */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
                <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Hourly Diurnal Pattern (30d average)</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.diurnal.map(d => ({ ...d, hour: `${d.hour}:00` }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#334155" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#334155" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 13 }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                    <Line type="monotone" dataKey="aqi"  stroke="#ef4444" strokeWidth={2} dot={false} name="AQI" />
                    <Line type="monotone" dataKey="pm25" stroke="#3b82f6" strokeWidth={2} dot={false} name="PM2.5" />
                    <Line type="monotone" dataKey="pm10" stroke="#f59e0b" strokeWidth={2} dot={false} name="PM10" />
                    <Line type="monotone" dataKey="o3"   stroke="#8b5cf6" strokeWidth={2} dot={false} name="O₃" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Forecast table */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
                <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>
                  {forecastDays}-Day Forecast · <span style={{ color: "#64748b", fontWeight: 400, fontSize: 13 }}>{data.model.algorithm} model</span>
                </h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                        {["Date", "AQI", "Lower", "Upper", "Category"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #1e293b" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.forecast.map((f) => (
                        <tr key={f.date} style={{ borderBottom: "1px solid #0f172a" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#1e293b")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{fmtDate(f.date)}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: aqiColor(f.aqi), fontSize: 18 }}>{f.aqi}</td>
                          <td style={{ padding: "10px 12px", color: "#64748b" }}>{f.aqi_lower}</td>
                          <td style={{ padding: "10px 12px", color: "#64748b" }}>{f.aqi_upper}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ background: `${aqiColor(f.aqi)}22`, color: aqiColor(f.aqi), padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                              {f.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Last historical record summary */}
              {lastHist && (
                <div style={{ background: "linear-gradient(135deg,#0f172a,#1a0a2e)", border: "1px solid #2d1b69", borderRadius: 14, padding: "20px 24px" }}>
                  <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 600 }}>Latest Daily Record — {fmtDate(lastHist.date)}</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 14, color: "#94a3b8" }}>
                    <span>AQI <strong style={{ color: aqiColor(lastHist.aqi) }}>{lastHist.aqi}</strong></span>
                    <span>Category <strong style={{ color: "#e2e8f0" }}>{lastHist.category}</strong></span>
                    <span>Dominant <strong style={{ color: "#8b5cf6" }}>{lastHist.dominant.toUpperCase()}</strong></span>
                    <span>PM2.5 <strong style={{ color: "#3b82f6" }}>{lastHist.pm25} µg/m³</strong></span>
                    <span>PM10 <strong style={{ color: "#f59e0b" }}>{lastHist.pm10} µg/m³</strong></span>
                    <span>NO₂ <strong style={{ color: "#22c55e" }}>{lastHist.no2} µg/m³</strong></span>
                    <span>O₃ <strong style={{ color: "#8b5cf6" }}>{lastHist.o3} µg/m³</strong></span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!loading && !data && !error && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
              <p style={{ fontSize: 18, margin: 0 }}>Select a city and click <strong style={{ color: "#3b82f6" }}>Analyze</strong> to load real air quality data.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
