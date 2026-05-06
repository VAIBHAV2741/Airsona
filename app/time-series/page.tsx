"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Legend,
} from "recharts";
import Navbar from "../components/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────
interface City { city: string; state: string; lat: number; lon: number; }
interface Historical {
  date: string; aqi: number; category: string; dominant: string;
  pm25: number; pm10: number; no2: number; o3: number; co: number; so2: number;
}
interface ForecastDay {
  date: string; aqi: number; aqi_lower: number; aqi_upper: number;
  prophet: number; xgb: number; hw: number;
}
interface ModelEval { model: string; mae: number; rmse: number; mape: number; r2: number; }
interface FeatureImp { feature: string; importance: number; }
interface DiurnalPoint { hour: number; pm25: number; pm10: number; no2: number; o3: number; aqi: number; }
interface SeasonData { season: string; avg_aqi: number; max_aqi: number; min_aqi: number; days: number; }
interface IndiaData {
  city: string; state: string;
  coordinates: { lat: number; lon: number };
  data_range: { start: string; end: string; total_days: number };
  current: {
    aqi: number; category: string; dominant: string; station: string;
    time: string; pollutants: { pm25: number; pm10: number; no2: number; o3: number; co: number; so2: number };
  };
  historical: Historical[];
  forecast: ForecastDay[];
  model_comparison: ModelEval[];
  ensemble_weights: { prophet: number; xgb: number; hw: number };
  feature_importance: FeatureImp[];
  diurnal: DiurnalPoint[];
  seasonal: SeasonData[];
  meta: { training_days: number; test_days: number; prophet_available: boolean; ci_margin_95: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function aqiColor(v: number) {
  if (v <= 50)  return "#22c55e";
  if (v <= 100) return "#eab308";
  if (v <= 150) return "#f97316";
  if (v <= 200) return "#ef4444";
  if (v <= 300) return "#a855f7";
  return "#7f1d1d";
}
function aqiLabel(v: number) {
  if (v <= 50)  return "Good";
  if (v <= 100) return "Moderate";
  if (v <= 150) return "Unhealthy for Sensitive";
  if (v <= 200) return "Unhealthy";
  if (v <= 300) return "Very Unhealthy";
  return "Hazardous";
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

const TABS = ["Historical", "ML Forecast", "Model Comparison", "Daily Pattern", "Breakdown"] as const;
type Tab = typeof TABS[number];

const S = {
  card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "20px 24px" },
  label: { fontSize: 11, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6 },
  tt: {
    contentStyle: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 13 },
    labelStyle: { color: "#94a3b8" },
    itemStyle: { color: "#e2e8f0" },
  },
};

// ── Main ───────────────────────────────────────────────────────────────────
export default function TimeSeriesPage() {
  const [cities, setCities]     = useState<City[]>([]);
  const [selected, setSelected] = useState<City | null>(null);
  const [data, setData]         = useState<IndiaData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<Tab>("Historical");

  useEffect(() => {
    fetch("/api/india-cities")
      .then(r => r.json())
      .then((d: City[]) => { setCities(d); setSelected(d[0]); })
      .catch(console.error);
  }, []);

  const fetchData = useCallback(async (city: City) => {
    setLoading(true); setError(null); setData(null);
    try {
      const res = await fetch(`/api/india-forecast?city=${encodeURIComponent(city.city)}&years=2&forecast_days=14`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (selected) fetchData(selected); }, [selected, fetchData]);

  const current = data?.current;
  const avgAqi  = data ? Math.round(data.historical.reduce((s, h) => s + h.aqi, 0) / data.historical.length) : 0;

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "#060912", color: "#e2e8f0", fontFamily: "'Inter',sans-serif", padding: "80px 24px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>
              Air Quality{" "}
              <span style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Time Series
              </span>
            </h1>
            <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
              ML Ensemble: Holt-Winters + XGBoost · 2 years of real data via Open-Meteo + WAQI
            </p>
          </div>

          {/* City selector */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28, alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={S.label}>City</label>
              <select
                value={selected?.city || ""}
                onChange={e => setSelected(cities.find(c => c.city === e.target.value) || null)}
                style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", padding: "8px 14px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
              >
                {cities.map(c => <option key={c.city} value={c.city}>{c.city}, {c.state}</option>)}
              </select>
            </div>
            <button
              onClick={() => selected && fetchData(selected)}
              disabled={loading}
              style={{ padding: "9px 22px", borderRadius: 8, background: loading ? "#1e3a5f" : "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Fetching…" : "Analyze"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#1a0a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "14px 20px", marginBottom: 24, color: "#fca5a5", fontSize: 14 }}>
              ⚠ {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
              <div style={{ width: 40, height: 40, border: "3px solid #1e293b", borderTop: "3px solid #3b82f6", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p style={{ margin: 0 }}>Training ML models on 2 years of data…</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155" }}>First load may take 30–60s (cold start)</p>
            </div>
          )}

          {/* Dashboard */}
          {!loading && data && (
            <>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
                <div style={{ ...S.card, gridColumn: "span 2", display: "flex", alignItems: "center", gap: 20, borderColor: `${aqiColor(current!.aqi)}44` }}>
                  <div style={{ fontSize: 60, fontWeight: 800, color: aqiColor(current!.aqi), lineHeight: 1 }}>{current!.aqi}</div>
                  <div>
                    <div style={S.label}>Live AQI · {current!.station}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: aqiColor(current!.aqi) }}>{current!.category}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Dominant: {current!.dominant?.toUpperCase()} · {current!.time}</div>
                  </div>
                </div>
                {[
                  { label: "Avg AQI (2yr)", value: avgAqi, color: aqiColor(avgAqi) },
                  { label: "Training Days", value: data.meta.training_days, color: "#3b82f6" },
                  { label: "Test Days", value: data.meta.test_days, color: "#8b5cf6" },
                  { label: "CI Margin ±", value: `${data.meta.ci_margin_95}`, color: "#22c55e" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={S.card}>
                    <div style={S.label}>{label}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid",
                    borderColor: tab === t ? "#3b82f6" : "#1e293b",
                    background: tab === t ? "#1e3a5f" : "transparent",
                    color: tab === t ? "#93c5fd" : "#64748b", cursor: "pointer",
                  }}>{t}</button>
                ))}
              </div>

              {/* ── Tab: Historical ── */}
              {tab === "Historical" && (
                <>
                  <div style={{ ...S.card, marginBottom: 20 }}>
                    <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>
                      AQI History · {data.data_range.start} → {data.data_range.end}
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400, marginLeft: 10 }}>{data.data_range.total_days} days</span>
                    </h2>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={data.historical.map(h => ({ date: fmtDate(h.date), aqi: h.aqi }))}>
                        <defs>
                          <linearGradient id="histG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#334155" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis stroke="#334155" tick={{ fontSize: 11 }} />
                        <Tooltip {...S.tt} />
                        <Area type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} fill="url(#histG)" dot={false} name="AQI" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                    {(["pm25","pm10","no2","o3"] as const).map((key, i) => {
                      const colors = ["#3b82f6","#f59e0b","#22c55e","#8b5cf6"];
                      const labels: Record<string, string> = { pm25:"PM2.5 µg/m³", pm10:"PM10 µg/m³", no2:"NO₂ µg/m³", o3:"O₃ µg/m³" };
                      return (
                        <div key={key} style={S.card}>
                          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{labels[key]}</p>
                          <ResponsiveContainer width="100%" height={130}>
                            <LineChart data={data.historical.map(h => ({ date: fmtDate(h.date), v: h[key] }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="date" hide />
                              <YAxis stroke="#334155" tick={{ fontSize: 10 }} width={32} />
                              <Tooltip {...S.tt} />
                              <Line type="monotone" dataKey="v" stroke={colors[i]} strokeWidth={2} dot={false} name={labels[key]} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Tab: ML Forecast ── */}
              {tab === "ML Forecast" && (
                <>
                  <div style={{ ...S.card, marginBottom: 20 }}>
                    <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>14-Day Ensemble Forecast</h2>
                    <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>Weighted ensemble: Holt-Winters + XGBoost · 95% confidence interval</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={data.forecast.map(f => ({ date: fmtDate(f.date), ensemble: f.aqi, xgb: f.xgb, hw: f.hw, upper: f.aqi_upper, lower: f.aqi_lower }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#334155" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#334155" tick={{ fontSize: 11 }} />
                        <Tooltip {...S.tt} />
                        <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                        <Area type="monotone" dataKey="upper" stroke="none" fill="#3b82f6" fillOpacity={0.1} name="CI Upper" legendType="none" />
                        <Area type="monotone" dataKey="lower" stroke="none" fill="#060912" fillOpacity={1} name="CI Lower" legendType="none" />
                        <Line type="monotone" dataKey="ensemble" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} name="Ensemble" />
                        <Line type="monotone" dataKey="xgb" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="XGBoost" />
                        <Line type="monotone" dataKey="hw" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Holt-Winters" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ ...S.card, overflowX: "auto" }}>
                    <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 600 }}>Forecast Table</h2>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                          {["Date","Ensemble","XGBoost","Holt-Winters","Lower","Upper"].map(h => (
                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #1e293b" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.forecast.map(f => (
                          <tr key={f.date} style={{ borderBottom: "1px solid #0f172a" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#1e293b")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{fmtDate(f.date)}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: aqiColor(f.aqi), fontSize: 17 }}>{f.aqi}</td>
                            <td style={{ padding: "10px 12px", color: "#22c55e" }}>{f.xgb}</td>
                            <td style={{ padding: "10px 12px", color: "#f97316" }}>{f.hw}</td>
                            <td style={{ padding: "10px 12px", color: "#64748b" }}>{f.aqi_lower}</td>
                            <td style={{ padding: "10px 12px", color: "#64748b" }}>{f.aqi_upper}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── Tab: Model Comparison ── */}
              {tab === "Model Comparison" && (
                <>
                  <div style={{ ...S.card, marginBottom: 20, overflowX: "auto" }}>
                    <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>Model Performance on Test Set</h2>
                    <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b" }}>Evaluated on {data.meta.test_days} held-out days (20% temporal split)</p>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                          {["Model","MAE","RMSE","MAPE %","R²"].map(h => (
                            <th key={h} style={{ padding: "8px 14px", textAlign: "left", borderBottom: "1px solid #1e293b" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.model_comparison.map((m, i) => (
                          <tr key={m.model} style={{ borderBottom: "1px solid #0f172a", background: i === data.model_comparison.length - 1 ? "#0a1628" : "transparent" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#1e293b")}
                            onMouseLeave={e => (e.currentTarget.style.background = i === data.model_comparison.length - 1 ? "#0a1628" : "transparent")}>
                            <td style={{ padding: "11px 14px", fontWeight: i === data.model_comparison.length - 1 ? 700 : 400, color: i === data.model_comparison.length - 1 ? "#93c5fd" : "#e2e8f0" }}>{m.model}</td>
                            <td style={{ padding: "11px 14px", color: "#f97316" }}>{m.mae}</td>
                            <td style={{ padding: "11px 14px", color: "#eab308" }}>{m.rmse}</td>
                            <td style={{ padding: "11px 14px", color: "#94a3b8" }}>{m.mape}%</td>
                            <td style={{ padding: "11px 14px", color: "#22c55e", fontWeight: 600 }}>{m.r2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={S.card}>
                      <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Ensemble Weights</h2>
                      {Object.entries(data.ensemble_weights).map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                            <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{k}</span>
                            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{(v * 100).toFixed(1)}%</span>
                          </div>
                          <div style={{ background: "#1e293b", borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${v * 100}%`, height: 6, borderRadius: 4, background: k === "xgb" ? "#22c55e" : k === "hw" ? "#f97316" : "#a855f7" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={S.card}>
                      <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600 }}>Top Feature Importance (XGBoost)</h2>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.feature_importance.slice(0, 8)} layout="vertical" margin={{ left: 10 }}>
                          <XAxis type="number" stroke="#334155" tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="feature" stroke="#334155" tick={{ fontSize: 10 }} width={80} />
                          <Tooltip {...S.tt} />
                          <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Importance %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {/* ── Tab: Daily Pattern ── */}
              {tab === "Daily Pattern" && (
                <div style={S.card}>
                  <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>24-Hour Diurnal Pattern</h2>
                  <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>Average by hour of day over 2 years</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data.diurnal.map(d => ({ ...d, hour: `${d.hour}:00` }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hour" stroke="#334155" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#334155" tick={{ fontSize: 11 }} />
                      <Tooltip {...S.tt} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                      <Line type="monotone" dataKey="aqi"  stroke="#ef4444" strokeWidth={2.5} dot={false} name="AQI" />
                      <Line type="monotone" dataKey="pm25" stroke="#3b82f6" strokeWidth={2} dot={false} name="PM2.5" />
                      <Line type="monotone" dataKey="pm10" stroke="#f59e0b" strokeWidth={2} dot={false} name="PM10" />
                      <Line type="monotone" dataKey="o3"   stroke="#8b5cf6" strokeWidth={2} dot={false} name="O₃" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Tab: Breakdown ── */}
              {tab === "Breakdown" && (
                <>
                  <div style={{ ...S.card, marginBottom: 16 }}>
                    <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Seasonal AQI Breakdown</h2>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={data.seasonal}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="season" stroke="#334155" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#334155" tick={{ fontSize: 11 }} />
                        <Tooltip {...S.tt} />
                        <Bar dataKey="avg_aqi" name="Avg AQI" radius={[6, 6, 0, 0]}
                          fill="#3b82f6"
                          label={{ position: "top", fontSize: 11, fill: "#94a3b8" }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
                    {data.seasonal.map(s => (
                      <div key={s.season} style={S.card}>
                        <div style={S.label}>{s.season}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: aqiColor(s.avg_aqi) }}>{s.avg_aqi}</div>
                        <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{aqiLabel(s.avg_aqi)}</div>
                        <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                          Max <strong style={{ color: "#ef4444" }}>{s.max_aqi}</strong> · Min <strong style={{ color: "#22c55e" }}>{s.min_aqi}</strong> · {s.days}d
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Empty state */}
          {!loading && !data && !error && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
              <p style={{ fontSize: 18, margin: 0 }}>Select a city to load real air quality data.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
