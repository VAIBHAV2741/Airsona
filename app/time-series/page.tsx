"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ComposedChart, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pollutants { pm25?: number; pm10?: number; no2?: number; o3?: number; co?: number; so2?: number; }
interface CurrentAQI { aqi: number; category: string; dominant: string; station: string; time: string; source: string; pollutants: Pollutants; }
interface HistoricalDay { date: string; aqi: number; category: string; dominant: string; pm25: number; pm10: number; no2: number; o3: number; co: number; so2: number; sub_pm25: number; sub_pm10: number; sub_no2: number; sub_o3: number; sub_co: number; sub_so2: number; }
interface ForecastDay { date: string; aqi: number; aqi_lower: number; aqi_upper: number; prophet: number; xgb: number; hw: number; }
interface DiurnalPoint { hour: number; pm25: number; pm10: number; no2: number; o3: number; so2: number; co: number; aqi: number; }
interface ModelEval { model: string; mae: number; rmse: number; mape: number; r2: number; }
interface FeatureImp { feature: string; importance: number; }
interface SeasonData { season: string; avg_aqi: number; max_aqi: number; min_aqi: number; days: number; }

interface IndiaData {
  city: string; state: string;
  coordinates: { lat: number; lon: number };
  data_range: { start: string; end: string; total_days: number };
  current: CurrentAQI;
  historical: HistoricalDay[];
  forecast: ForecastDay[];
  model_comparison: ModelEval[];
  ensemble_weights: { prophet: number; xgb: number; hw: number };
  feature_importance: FeatureImp[];
  diurnal: DiurnalPoint[];
  seasonal: SeasonData[];
  meta: { training_days: number; test_days: number; prophet_available: boolean; ci_margin_95: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_CITIES = ["Delhi","Mumbai","Kolkata","Bangalore","Lucknow","Chennai","Hyderabad","Ahmedabad"];

const POLL_COLORS: Record<string, string> = {
  pm25:"#ef4444", pm10:"#f97316", no2:"#eab308", o3:"#22c55e", co:"#3b82f6", so2:"#8b5cf6",
};

const MODEL_COLORS: Record<string, string> = {
  "Ensemble (Prophet+XGB+HW)": "#3b82f6",
  "Prophet": "#a855f7", "XGBoost": "#22c55e",
  "Holt-Winters": "#f97316", "Naive Seasonal": "#6b7280",
};

const SEASON_COLORS: Record<string, string> = {
  "Winter": "#60a5fa", "Summer": "#fbbf24",
  "Monsoon": "#34d399", "Post-Monsoon": "#f87171",
};

function aqiColor(v: number) {
  if (v <= 50)  return "#22c55e";
  if (v <= 100) return "#eab308";
  if (v <= 150) return "#f97316";
  if (v <= 200) return "#ef4444";
  if (v <= 300) return "#8b5cf6";
  return "#7e0023";
}

const TT = {
  contentStyle: { backgroundColor: "#0a0a0f", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#9ca3af" }, itemStyle: { color: "#e5e7eb" },
};

const API = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

// ─── Small components ─────────────────────────────────────────────────────────

function AQIHero({ current }: { current: CurrentAQI }) {
  const c = aqiColor(current.aqi ?? 0);
  return (
    <div className="flex flex-wrap gap-4 items-start">
      <div className="rounded-2xl border p-6 text-center min-w-[120px]"
        style={{ borderColor: c + "55", background: c + "12" }}>
        <div className="text-6xl font-black" style={{ color: c }}>{current.aqi}</div>
        <div className="text-xs mt-1 font-semibold" style={{ color: c }}>{current.category}</div>
      </div>
      <div className="grid grid-cols-3 gap-3 flex-1">
        {[
          ["Station", current.station, current.source],
          ["Dominant", (current.dominant ?? "—").toUpperCase(), "pollutant"],
          ["PM2.5", current.pollutants.pm25 != null ? `${current.pollutants.pm25} µg/m³` : "—", ""],
          ["PM10",  current.pollutants.pm10 != null ? `${current.pollutants.pm10} µg/m³`  : "—", ""],
          ["NO₂",   current.pollutants.no2  != null ? `${current.pollutants.no2} µg/m³`   : "—", ""],
          ["O₃",    current.pollutants.o3   != null ? `${current.pollutants.o3} µg/m³`    : "—", ""],
        ].map(([l, v, s]) => (
          <div key={l} className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{l}</p>
            <p className="text-sm font-bold text-white mt-0.5">{v}</p>
            {s && <p className="text-[10px] text-gray-600">{s}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${active ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-200"}`}>
      {label}
    </button>
  );
}

// ─── Model Comparison Table (research paper quality) ─────────────────────────

function ModelTable({ data, weights }: { data: ModelEval[]; weights: { prophet: number; xgb: number; hw: number } }) {
  const best = (key: keyof ModelEval) => {
    const vals = data.map(d => d[key] as number);
    return key === "r2" ? Math.max(...vals) : Math.min(...vals);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>Ensemble weights —</span>
        <span className="text-purple-400">Prophet: {(weights.prophet*100).toFixed(0)}%</span>
        <span className="text-green-400">XGBoost: {(weights.xgb*100).toFixed(0)}%</span>
        <span className="text-orange-400">Holt-Winters: {(weights.hw*100).toFixed(0)}%</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              {["Model","MAE ↓","RMSE ↓","MAPE % ↓","R² ↑"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const isEns = row.model.includes("Ensemble");
              return (
                <tr key={i} className={`border-t border-gray-800/50 ${isEns ? "bg-blue-950/30" : "hover:bg-gray-800/20"} transition`}>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: MODEL_COLORS[row.model] || "#fff" }}>
                      {row.model}{isEns && " ★"}
                    </span>
                  </td>
                  {(["mae","rmse","mape","r2"] as const).map(k => {
                    const isBest = row[k] === best(k);
                    return (
                      <td key={k} className={`px-4 py-3 font-mono ${isBest ? "text-green-400 font-bold" : "text-gray-300"}`}>
                        {k === "r2" ? row[k].toFixed(4) : row[k].toFixed(2)}
                        {isBest && " ✓"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-600">Evaluated on 20% held-out test set (temporal split). ↓=lower is better, ↑=higher is better.</p>
    </div>
  );
}

// ─── Historical Charts ────────────────────────────────────────────────────────

function HistoricalCharts({ data, seasonal }: { data: HistoricalDay[]; seasonal: SeasonData[] }) {
  const fmt = data.map(d => ({ ...d, label: d.date.slice(5) }));
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">AQI Trend ({data.length} days)</h3>
        <div className="h-56 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fmt}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="label" stroke="#374151" tick={{ fontSize:10 }} interval={Math.floor(data.length/10)}/>
              <YAxis stroke="#374151" tick={{ fontSize:10 }}/>
              <Tooltip {...TT}/>
              <ReferenceLine y={100} stroke="#eab308" strokeDasharray="4 4"/>
              <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="4 4"/>
              <Area type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} fill="url(#ag)" dot={false} name="AQI"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Seasonal AQI Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {seasonal.map(s => (
            <div key={s.season} className="rounded-xl border border-gray-800 p-4"
              style={{ borderColor: SEASON_COLORS[s.season] + "40", background: SEASON_COLORS[s.season] + "0a" }}>
              <div className="text-sm font-bold" style={{ color: SEASON_COLORS[s.season] }}>{s.season}</div>
              <div className="text-2xl font-black text-white mt-1">{s.avg_aqi}</div>
              <div className="text-[10px] text-gray-500 mt-1">avg AQI · {s.days}d</div>
              <div className="text-[10px] text-gray-600">range {s.min_aqi}–{s.max_aqi}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Pollutant Concentrations (µg/m³)</h3>
        <div className="h-52 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fmt}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="label" stroke="#374151" tick={{ fontSize:10 }} interval={Math.floor(data.length/8)}/>
              <YAxis stroke="#374151" tick={{ fontSize:10 }}/>
              <Tooltip {...TT}/>
              <Legend wrapperStyle={{ fontSize:11 }}/>
              {(["pm25","pm10","no2","o3"] as const).map(k => (
                <Line key={k} type="monotone" dataKey={k} stroke={POLL_COLORS[k]} strokeWidth={1.5} dot={false} name={k.toUpperCase()}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Forecast Charts ──────────────────────────────────────────────────────────

function ForecastCharts({ forecast, meta }: { forecast: ForecastDay[]; meta: IndiaData["meta"] }) {
  const fmt = forecast.map(d => ({
    ...d,
    label: d.date.slice(5),
    band: d.aqi_upper - d.aqi_lower,
    base: d.aqi_lower,
  }));
  return (
    <div className="space-y-6">
      <div className="h-64 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={fmt}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
            <XAxis dataKey="label" stroke="#374151" tick={{ fontSize:12 }}/>
            <YAxis stroke="#374151" tick={{ fontSize:12 }}/>
            <Tooltip {...TT}/>
            <Legend wrapperStyle={{ fontSize:11 }}/>
            <Bar dataKey="base" stackId="ci" fill="transparent" legendType="none"/>
            <Bar dataKey="band" stackId="ci" fill="#3b82f625" legendType="none" name="95% CI"/>
            <Line type="monotone" dataKey="aqi"     stroke="#3b82f6" strokeWidth={3} dot={{ r:5, fill:"#3b82f6" }} name="Ensemble"/>
            <Line type="monotone" dataKey="prophet" stroke="#a855f7" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Prophet"/>
            <Line type="monotone" dataKey="xgb"     stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="XGBoost"/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {[
          ["Training Days", `${meta.training_days}`],
          ["Test Days", `${meta.test_days}` ],
          ["95% CI Width", `±${(meta.ci_margin_95).toFixed(0)} AQI`],
          ["Prophet", meta.prophet_available ? "✓ Active" : "✗ Fallback"],
        ].map(([l,v]) => (
          <div key={l} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{l}</p>
            <p className="text-lg font-bold text-white mt-1">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/80">
            <tr>{["Date","Ensemble","Lower","Upper","Prophet","XGBoost"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-gray-400 font-medium text-xs">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {forecast.map((d,i) => (
              <tr key={i} className="border-t border-gray-800/40 hover:bg-gray-800/20 transition">
                <td className="px-4 py-2.5 text-gray-400">{d.date}</td>
                <td className="px-4 py-2.5 font-bold" style={{ color: aqiColor(d.aqi) }}>{d.aqi}</td>
                <td className="px-4 py-2.5 text-gray-500">{d.aqi_lower}</td>
                <td className="px-4 py-2.5 text-gray-500">{d.aqi_upper}</td>
                <td className="px-4 py-2.5 text-purple-400">{d.prophet}</td>
                <td className="px-4 py-2.5 text-green-400">{d.xgb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Diurnal Charts ───────────────────────────────────────────────────────────

function DiurnalCharts({ diurnal }: { diurnal: DiurnalPoint[] }) {
  const fmt = diurnal.map(d => ({ ...d, label: `${String(d.hour).padStart(2,"0")}:00` }));
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Average AQI by Hour of Day</h3>
        <p className="text-[11px] text-gray-600 mb-3">Averaged over all historical days — reveals morning traffic peak and evening inversion layer.</p>
        <div className="h-52 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fmt}>
              <defs>
                <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="label" stroke="#374151" tick={{ fontSize:10 }} interval={2}/>
              <YAxis stroke="#374151" tick={{ fontSize:10 }}/>
              <Tooltip {...TT}/>
              <ReferenceLine x="08:00" stroke="#4b5563" strokeDasharray="3 3"/>
              <ReferenceLine x="18:00" stroke="#4b5563" strokeDasharray="3 3"/>
              <Area type="monotone" dataKey="aqi" stroke="#f97316" strokeWidth={2} fill="url(#dg)" dot={false} name="Avg AQI"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Pollutant Diurnal Variation (µg/m³)</h3>
        <div className="h-52 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fmt}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="label" stroke="#374151" tick={{ fontSize:10 }} interval={2}/>
              <YAxis stroke="#374151" tick={{ fontSize:10 }}/>
              <Tooltip {...TT}/>
              <Legend wrapperStyle={{ fontSize:11 }}/>
              {(["pm25","pm10","no2","o3"] as const).map(k => (
                <Line key={k} type="monotone" dataKey={k} stroke={POLL_COLORS[k]} strokeWidth={2} dot={false} name={k.toUpperCase()}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Breakdown + Feature Importance ──────────────────────────────────────────

function BreakdownCharts({ data, features }: { data: HistoricalDay[]; features: FeatureImp[] }) {
  const last14 = data.slice(-14).map(d => ({
    label: d.date.slice(5),
    "PM2.5": d.sub_pm25, PM10: d.sub_pm10,
    NO2: d.sub_no2,      O3: d.sub_o3,
    CO: d.sub_co,        SO2: d.sub_so2,
  }));
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sub-AQI Pollutant Contribution (last 14 days)</h3>
        <p className="text-[11px] text-gray-600 mb-3">Height = each pollutant&apos;s contribution to the final AQI (EPA sub-index method).</p>
        <div className="h-64 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="label" stroke="#374151" tick={{ fontSize:11 }}/>
              <YAxis stroke="#374151" tick={{ fontSize:11 }}/>
              <Tooltip {...TT}/>
              <Legend wrapperStyle={{ fontSize:11 }}/>
              {[["PM2.5","pm25"],["PM10","pm10"],["NO2","no2"],["O3","o3"],["CO","co"],["SO2","so2"]].map(([label,key]) => (
                <Bar key={key} dataKey={label} stackId="a" fill={POLL_COLORS[key]}/>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">XGBoost Feature Importance (research)</h3>
        <div className="space-y-2">
          {features.map(f => (
            <div key={f.feature} className="flex items-center gap-3">
              <div className="text-xs text-gray-400 w-40 truncate">{f.feature}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, f.importance * 4)}%` }}/>
              </div>
              <div className="text-xs text-gray-500 w-12 text-right">{f.importance.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "historical" | "forecast" | "models" | "diurnal" | "breakdown";

export default function TimeSeriesPage() {
  const [city, setCity] = useState("Delhi");
  const [years, setYears] = useState(2);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IndiaData | null>(null);
  const [tab, setTab] = useState<Tab>("historical");

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setData(null);

    try {
      setStage("Fetching 2 years of hourly data from Open-Meteo…");
      const url = `${API}/api/v1/india-forecast?city=${encodeURIComponent(city)}&years=${years}&forecast_days=14`;
      setStage("Training Prophet + XGBoost + Ensemble (may take ~30s)…");
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `API error ${res.status}`);
      }
      const json: IndiaData = await res.json();
      setData(json);
      setTab("historical");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false); setStage("");
    }
  }

  const TABS: [Tab, string][] = [
    ["historical", "Historical"],
    ["forecast",   "ML Forecast"],
    ["models",     "Model Comparison"],
    ["diurnal",    "Daily Pattern"],
    ["breakdown",  "Breakdown"],
  ];

  return (
    <>
      <Navbar/>
      <div className="min-h-screen bg-black text-white px-4 py-8 max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Air Quality <span className="text-blue-500">Time Series</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            2-year Open-Meteo data · Prophet + XGBoost ensemble · EPA AQI · Indian seasonality (Diwali, stubble burning, monsoon)
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="flex flex-wrap gap-3 mb-8 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">City</label>
            <select value={city} onChange={e => setCity(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500">
              {INDIAN_CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Training Data</label>
            <select value={years} onChange={e => setYears(Number(e.target.value))}
              className="px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500">
              <option value={1}>1 Year</option>
              <option value={2}>2 Years</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-semibold transition">
            {loading ? "Running Pipeline…" : "Analyze"}
          </button>
        </form>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-sm text-center max-w-sm">{stage}</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/30 p-4 text-red-400 text-sm mb-6">{error}</div>
        )}

        {data && !loading && (
          <div className="space-y-6">

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-white font-semibold">{data.city}, {data.state}</span>
              <span>·</span>
              <span>{data.data_range.start} → {data.data_range.end}</span>
              <span>·</span>
              <span>{data.data_range.total_days} days</span>
            </div>

            <AQIHero current={data.current}/>

            <div className="flex gap-1 border-b border-gray-800 pb-0 overflow-x-auto">
              {TABS.map(([id, label]) => (
                <TabBtn key={id} active={tab === id} onClick={() => setTab(id)} label={label}/>
              ))}
            </div>

            <div className="pt-2">
              {tab === "historical"  && <HistoricalCharts data={data.historical} seasonal={data.seasonal}/>}
              {tab === "forecast"    && <ForecastCharts   forecast={data.forecast} meta={data.meta}/>}
              {tab === "models"      && <ModelTable data={data.model_comparison} weights={data.ensemble_weights}/>}
              {tab === "diurnal"     && <DiurnalCharts    diurnal={data.diurnal}/>}
              {tab === "breakdown"   && <BreakdownCharts  data={data.historical} features={data.feature_importance}/>}
            </div>

          </div>
        )}

        {!data && !loading && !error && (
          <div className="text-center py-20 text-gray-700 text-sm">
            Select an Indian city and click Analyze to run the ML pipeline.
          </div>
        )}
      </div>
    </>
  );
}
