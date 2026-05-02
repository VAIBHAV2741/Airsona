"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  RecommendationEngineResponse,
  SolutionScore,
  WhatIfScenario,
  Insight,
} from "./lib/engine.types";

// ── Solution Icon Map ────────────────────────────────────────
const solutionIcons: Record<string, string> = {
  "Solar Energy": "☀️",
  "Wind Energy": "💨",
  Biogas: "♻️",
  "Micro-Hydro": "💧",
  "Rainwater Harvesting": "🌧️",
  "Green Roofs": "🌿",
  "EV Adoption": "🔋",
  "Waste Segregation": "🗑️",
  "Urban Cooling": "❄️",
  "Public Transport Optimization": "🚌",
};

const insightColors: Record<string, { bg: string; border: string; icon: string }> = {
  comparison: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "⚖️" },
  opportunity: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "💡" },
  barrier: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "🚧" },
  synergy: { bg: "bg-violet-500/10", border: "border-violet-500/30", icon: "🔗" },
  warning: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "⚠️" },
};

const difficultyColor: Record<string, string> = {
  Low: "text-emerald-400",
  Medium: "text-yellow-400",
  High: "text-orange-400",
  "Very High": "text-red-400",
};

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75 ? "#34d399" : score >= 55 ? "#fbbf24" : score >= 35 ? "#fb923c" : "#f87171";

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="4"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={size > 50 ? "14" : "11"}
        fontWeight="bold"
      >
        {score}
      </text>
    </svg>
  );
}

function BarChart({ items }: { items: { label: string; value: number; category: string }[] }) {
  const maxVal = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-36 truncate text-right">{item.label}</span>
          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxVal) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.06 }}
              style={{
                background:
                  item.category === "renewable_energy"
                    ? "linear-gradient(90deg, #059669, #34d399)"
                    : "linear-gradient(90deg, #2563eb, #60a5fa)",
              }}
            />
            <span className="absolute right-2 top-0 text-[10px] text-white/70 leading-5">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EnginePage() {
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RecommendationEngineResponse | null>(null);
  const [expandedSolution, setExpandedSolution] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"recommendations" | "scenarios" | "insights">(
    "recommendations"
  );
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLoc = localStorage.getItem("airsona_location");
    if (savedLoc) {
      setCityInput(savedLoc);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!cityInput.trim()) {
      setError("Please enter a city name.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setExpandedSolution(null);

    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityInput.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API returned ${res.status}`);
      }
      const data: RecommendationEngineResponse = await res.json();
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err: any) {
      setError(err.message || "Failed to run analysis.");
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = result
    ? [
        {
          label: "Solar Potential",
          value: result.profile_summary.solar_potential,
          icon: "☀️",
          color: "from-amber-500/20 to-orange-500/20",
        },
        {
          label: "Wind Potential",
          value: result.profile_summary.wind_potential,
          icon: "💨",
          color: "from-sky-500/20 to-blue-500/20",
        },
        {
          label: "Pollution Severity",
          value: result.profile_summary.pollution_severity,
          icon: "🫁",
          color: "from-red-500/20 to-pink-500/20",
        },
        {
          label: "Urbanization",
          value: result.profile_summary.urbanization,
          icon: "🏙️",
          color: "from-violet-500/20 to-purple-500/20",
        },
        {
          label: "Environmental Risk",
          value: `${result.profile_summary.overall_environmental_risk}/100`,
          icon: "⚡",
          color: "from-emerald-500/20 to-teal-500/20",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#0a0f1e] to-[#030712] text-white font-[Inter]">
      {/* ── Hero / Search ──────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient glow blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Environmental
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
                Recommendation Engine
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
              AI-powered multi-factor analysis scoring 10 environmental solutions for any city —
              powered by NASA, Open-Meteo, OpenAQ, and OpenStreetMap data.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 max-w-xl mx-auto"
          >
            <div className="relative flex-1 w-full">
              <input
                id="engine-city-input"
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="Enter a city name…"
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">
                🌍
              </span>
            </div>
            <button
              id="engine-analyze-btn"
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>⚡ Run Analysis</>
              )}
            </button>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-4 text-red-400 text-sm"
            >
              {error}
            </motion.p>
          )}
        </div>
      </section>

      {/* ── Results ────────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto px-6 pb-24"
          >
            {/* Location Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg">
                📍
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {result.location.city}, {result.location.country}
                </h2>
                <p className="text-xs text-slate-500">
                  {result.location.coordinates.lat.toFixed(4)}°,{" "}
                  {result.location.coordinates.lon.toFixed(4)}° · {result.location.timezone} ·
                  Generated {new Date(result.generatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* ── Profile Summary Cards ──────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
              {summaryCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl border border-white/5 bg-gradient-to-br ${card.color} backdrop-blur-sm p-4`}
                >
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                  <p className="text-sm font-bold capitalize">{card.value}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Tab Navigation ──────────────────────────── */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-8 w-fit">
              {(["recommendations", "scenarios", "insights"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                    activeTab === tab
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "recommendations" ? "🏆 Top Solutions" : tab === "scenarios" ? "🔮 What-If" : "💡 Insights"}
                </button>
              ))}
            </div>

            {/* ── TAB: Recommendations ────────────────────── */}
            {activeTab === "recommendations" && (
              <div className="space-y-8">
                {/* Comparison Matrix */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-5">Solution Comparison Matrix</h3>
                  <BarChart
                    items={result.comparisonMatrix.map((c) => ({
                      label: `${solutionIcons[c.solution] || ""} ${c.solution}`,
                      value: c.score,
                      category: c.category,
                    }))}
                  />
                  <div className="flex gap-6 mt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-1.5 rounded-full bg-emerald-500" /> Renewable Energy
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-1.5 rounded-full bg-blue-500" /> Environmental Action
                    </span>
                  </div>
                </div>

                {/* Solution Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.topRecommendations.map((sol, i) => (
                    <motion.div
                      key={sol.solution}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden ${
                        expandedSolution === i ? "col-span-1 md:col-span-2" : ""
                      }`}
                      onClick={() => setExpandedSolution(expandedSolution === i ? null : i)}
                    >
                      <div className="p-5">
                        {/* Header Row */}
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{solutionIcons[sol.solution] || "🔬"}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10">
                                #{sol.rank}
                              </span>
                              <h4 className="font-bold truncate">{sol.solution}</h4>
                              {sol.quickWin && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                                  QUICK WIN
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {sol.category === "renewable_energy" ? "Renewable Energy" : "Environmental Action"} ·{" "}
                              <span className={difficultyColor[sol.implementationDifficulty]}>
                                {sol.implementationDifficulty}
                              </span>{" "}
                              · {sol.timeToImpact}
                            </p>
                          </div>
                          <ScoreRing score={sol.score} />
                        </div>

                        {/* Reason (always visible) */}
                        <p className="text-sm text-slate-300 mt-3 leading-relaxed line-clamp-2">
                          {sol.reason}
                        </p>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {expandedSolution === i && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                                {/* Impact */}
                                <div>
                                  <p className="text-xs font-semibold text-emerald-400 mb-1">
                                    Estimated Impact
                                  </p>
                                  <p className="text-sm text-slate-300">{sol.estimatedImpact}</p>
                                </div>

                                {/* Cost + Timeline */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                      Cost Estimate
                                    </p>
                                    <p className="text-sm font-semibold mt-1">{sol.costEstimate}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                      Confidence
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex-1 h-1.5 bg-white/10 rounded-full">
                                        <div
                                          className="h-full bg-emerald-400 rounded-full"
                                          style={{ width: `${sol.confidence}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-semibold">{sol.confidence}%</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Co-benefits */}
                                {sol.cobenefits.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-blue-400 mb-2">
                                      Co-Benefits
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {sol.cobenefits.map((cb) => (
                                        <span
                                          key={cb}
                                          className="text-[11px] px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300"
                                        >
                                          {cb}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Barriers */}
                                {sol.barriers.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-amber-400 mb-2">
                                      Barriers
                                    </p>
                                    <div className="space-y-1">
                                      {sol.barriers.map((b) => (
                                        <p key={b} className="text-xs text-slate-400 flex items-start gap-2">
                                          <span className="text-amber-400 mt-0.5">⚠</span> {b}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Subscores */}
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 mb-2">
                                    Factor Breakdown
                                  </p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(sol.subscores).map(([key, val]) => (
                                      <div key={key} className="bg-white/5 rounded-lg p-2">
                                        <p className="text-[10px] text-slate-500 capitalize">
                                          {key.replace(/([A-Z])/g, " $1").trim()}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <div className="flex-1 h-1 bg-white/10 rounded-full">
                                            <div
                                              className="h-full bg-white/40 rounded-full transition-all"
                                              style={{ width: `${Math.min(100, val)}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-mono">
                                            {Math.round(val)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: What-If Scenarios ──────────────────── */}
            {activeTab === "scenarios" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold mb-2">What-If Scenarios</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Projected outcomes if specific environmental interventions are implemented.
                </p>
                {result.whatIfScenarios.map((sc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"
                  >
                    <h4 className="font-bold text-lg mb-1">🔮 {sc.scenario}</h4>
                    <p className="text-xs text-slate-500 mb-5">{sc.assumption}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">
                          AQI Change
                        </p>
                        <p className="text-2xl font-extrabold text-emerald-400">
                          {sc.projectedAQIChange > 0 ? "+" : ""}
                          {sc.projectedAQIChange}%
                        </p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">
                          CO₂ Reduction
                        </p>
                        <p className="text-2xl font-extrabold text-blue-400">
                          {sc.projectedCO2ReductionTons.toLocaleString()}
                          <span className="text-xs font-normal ml-1">tons</span>
                        </p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">
                          Energy Generated
                        </p>
                        <p className="text-2xl font-extrabold text-amber-400">
                          {sc.projectedEnergyMWh.toLocaleString()}
                          <span className="text-xs font-normal ml-1">MWh</span>
                        </p>
                      </div>
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                        <p className="text-[10px] text-violet-400 uppercase tracking-wider mb-1">
                          Jobs Created
                        </p>
                        <p className="text-2xl font-extrabold text-violet-400">
                          {sc.projectedJobs.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-3 text-right">
                      Confidence: {sc.confidence}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── TAB: Insights ────────────────────────────── */}
            {activeTab === "insights" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold mb-2">AI-Generated Insights</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Key findings, synergies, and warnings from the analysis.
                </p>
                {result.insights.map((ins, i) => {
                  const style = insightColors[ins.type] || insightColors.opportunity;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`${style.bg} border ${style.border} rounded-2xl p-5`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">{style.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm">{ins.title}</h4>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                ins.priority === "high"
                                  ? "bg-red-500/20 text-red-400"
                                  : ins.priority === "medium"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-slate-500/20 text-slate-400"
                              }`}
                            >
                              {ins.priority}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{ins.body}</p>
                          <p className="text-xs text-slate-500 mt-2 font-mono">
                            {ins.supporting_data}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── Data Quality Footer ─────────────────────── */}
            <div className="mt-12 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Data Quality Assessment
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(result.dataQuality).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-full">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span className="capitalize">{key}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${val}%`,
                            background:
                              val >= 80
                                ? "#34d399"
                                : val >= 60
                                ? "#fbbf24"
                                : "#f87171",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty State ────────────────────────────────────── */}
      {!result && !loading && (
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🌍</div>
            <h3 className="text-xl font-bold text-slate-400">Enter a city to begin</h3>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              The engine aggregates real-time data from 5+ sources and scores 10 environmental
              solutions including Solar, Wind, Biogas, EV Adoption, Green Roofs, and more.
            </p>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl mx-auto">
              {Object.entries(solutionIcons).map(([name, icon]) => (
                <div
                  key={name}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center"
                >
                  <div className="text-2xl">{icon}</div>
                  <p className="text-[10px] text-slate-500 mt-1">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
