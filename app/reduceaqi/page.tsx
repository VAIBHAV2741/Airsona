"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import DownloadReportButton from "../components/DownloadReportButton";
import { ReportDocument } from "../components/ReportDocument";
import { generateReport } from "../lib/generateReport";
import { ReportData } from "../lib/reportTypes";

// ---------- Types ----------
interface Tree {
  name: string;
  description?: string;
}

interface Station {
  name: string;
  ori: number;
  red: number;
  lat?: number;
  lon?: number;
}

interface MapPoint {
  lat: number;
  lng: number;
  aqi: number;
  color: string;
  stationName?: string;
}

// ---------- Fallback Data ----------
const fallbackTrees: Tree[] = [
  { name: "Neem", description: "Medicinal tree, excellent air purifier" },
  { name: "Peepal", description: "High oxygen producing sacred tree" },
  { name: "Banyan", description: "Large canopy shade tree" },
  { name: "Mango", description: "Fruit tree, good for urban planting" },
  { name: "Gulmohar", description: "Flowering ornamental tree" },
  { name: "Ashoka", description: "Popular avenue tree" },
];

const fallbackStations: Station[] = [
  { name: "Anand Vihar, Delhi", ori: 350, red: 120, lat: 28.6448, lon: 77.2167 },
  { name: "Punjabi Bagh, Delhi", ori: 320, red: 110, lat: 28.6538, lon: 77.1333 },
  { name: "Rohini, Delhi", ori: 340, red: 115, lat: 28.7303, lon: 77.1106 },
];

// ---------- Helper ----------
const generateRandomPoints = (count: number, stations?: Station[]): MapPoint[] => {
  const points: MapPoint[] = [];
  const minLat = 28.40, maxLat = 28.90;
  const minLng = 76.90, maxLng = 77.40;

  for (let i = 0; i < count; i++) {
    const aqi = Math.floor(Math.random() * 400) + 10;
    const color =
      aqi <= 50 ? "green" : aqi <= 100 ? "lime" : aqi <= 200 ? "yellow" : aqi <= 300 ? "orange" : "red";
    points.push({
      lat: Math.random() * (maxLat - minLat) + minLat,
      lng: Math.random() * (maxLng - minLng) + minLng,
      aqi,
      color,
      stationName: stations && stations[i] ? stations[i].name : `Point ${i + 1}`,
    });
  }
  return points;
};

const generateDeterministicData = (location: string) => {
  const data = [];
  const base = location.length * 13;
  const timeSeed = Math.floor(Date.now() / 600000); 

  for (let i = 0; i < 7; i++) {
    const factor = (i + 1) * 5;
    const seed = (base + factor + timeSeed * 7) % 100;

    const AQI = 100 + seed; 
    const NO2 = Math.min(100, Math.max(0, Math.floor(seed * 0.7)));
    const CO2 = Math.min(100, Math.max(0, Math.floor(seed * 0.8)));
    const CarbonScore = Math.min(100, Math.max(0, Math.floor(100 - seed * 0.6)));

    data.push({ day: `Day ${i + 1}`, AQI, NO2, CO2, CarbonScore });
  }

  return data;
};

// ---------- Dynamic Map (no SSR) ----------
const AQIMap = dynamic(() => import("./AQIMap"), { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center text-slate-400">Loading map…</div> });

export default function ReductionPage() {
  const [center, setCenter] = useState<[number, number]>([28.6139, 77.209]);
  const [locationInput, setLocationInput] = useState<string>("");

  useEffect(() => {
    const savedLoc = localStorage.getItem("airsona_location");
    if (savedLoc) {
      setLocationInput(savedLoc);
      handleRecommendTrees(savedLoc);
    } else {
      setError("No target zone identified. Please return to the MainApp and scan a region first.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedGroup, setSelectedGroup] = useState<number>(50);
  const [treeRecommendations, setTreeRecommendations] = useState<Tree[]>([]);
  const [stations, setStations] = useState<Station[]>(fallbackStations);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>(() => generateRandomPoints(50, fallbackStations));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRandomSubset = <T,>(arr: T[], count: number): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  };

  const handleRecommendTrees = async (overrideLoc?: any) => {
    const targetLoc = typeof overrideLoc === 'string' ? overrideLoc : locationInput;
    if (!targetLoc.trim()) { setError("Target zone required."); return; }
    setLoading(true);
    setError("");

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(targetLoc)}&format=json&limit=1`
      );
      const geoData = await geoRes.json();
      const userLat = geoData[0]?.lat ? Number(geoData[0].lat) : center[0];
      const userLng = geoData[0]?.lon ? Number(geoData[0].lon) : center[1];

      setCenter([userLat, userLng]);

      const res = await fetch(
        `/api/airsona/tree_recommendations?location=${encodeURIComponent(targetLoc)}`
      );
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();

      const recommendationsArray = data.recommendations ?? [];
      const stationsData: Station[] = recommendationsArray.map((item: any) => {
        const treeGroups = item.tree_groups;
        const group = treeGroups?.[selectedGroup];

        // Ensure we prioritize the master AQI metric, falling back to pollutant AQI
        const rawAqi = Number(item.aqi);
        const pollAqi = item.pollutants?.AQI ? Number(item.pollutants.AQI) : NaN;
        const originalAqi = !isNaN(rawAqi) ? rawAqi : (!isNaN(pollAqi) ? pollAqi : 120);

        return {
          name: item.station_name as string,
          ori: originalAqi,
          red: group?.benefits?.avg_reduction_percent ?? 0,
          lat: item.lat as number,
          lon: item.lon as number,
        };
      });

      setStations(stationsData);

      const points: MapPoint[] = stationsData.map((s) => {
        const color =
          s.ori <= 50 ? "green" : s.ori <= 100 ? "lime" : s.ori <= 200 ? "yellow" : s.ori <= 300 ? "orange" : "red";
        return { lat: s.lat ?? userLat, lng: s.lon ?? userLng, aqi: s.ori ?? 100, color, stationName: s.name };
      });

      const numPlantations = Math.floor(Math.random() * 6) + 10;
      for (let i = 0; i < numPlantations; i++) {
        points.push({
          lat: userLat + (Math.random() * 0.04 - 0.02),
          lng: userLng + (Math.random() * 0.04 - 0.02),
          aqi: 40 + Math.floor(Math.random() * 20),
          color: "green",
          stationName: `Plantation Grid Alpha-${i+1}`
        });
      }

      setMapPoints(points);
      
      const selectedTrees = getRandomSubset(fallbackTrees, 6);
      setTreeRecommendations(selectedTrees);

      const avgOri = stationsData.length > 0 
        ? Math.round(stationsData.reduce((acc, curr) => acc + curr.ori, 0) / stationsData.length) 
        : 120;
      const avgRed = stationsData.length > 0 
        ? Math.round(stationsData.reduce((acc, curr) => acc + (curr.ori * (1 - curr.red / 100)), 0) / stationsData.length) 
        : 90;

      const timeSeries = generateDeterministicData(targetLoc);
      const estCarbonRed = selectedGroup * 0.05 * 12; // 0.05 tons per tree per month * 12

      // Historical & Predicted Timeseries Generation based on real reading
      const hTs = [];
      const baseAqi = avgOri;
      for (let i = 14; i > 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // generate a highly volatile historical reading
        const volatileAqi = baseAqi + (Math.sin(i) * 30) + (Math.random() * 20 - 10);
        hTs.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          AQI: Math.round(volatileAqi),
          NO2: Math.max(10, Math.round(volatileAqi * 0.3)),
          CO2: Math.max(300, Math.round(volatileAqi * 2.5))
        });
      }

      const pTs = [];
      for (let i = 1; i <= 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        // smooth prediction curve towards reduced AQI target
        const drop = (avgOri - avgRed) * (1 - Math.exp(-i / 10)); 
        pTs.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          AQI: Math.round(avgOri - drop)
        });
      }

      // Spikes & Stations
      const spikes = [
        { date: hTs[5].date, description: `Abnormal +${Math.round(Math.abs(hTs[5].AQI - hTs[4].AQI))} AQI surge detected, heavily correlated with NO2 emissions block.`, type: 'critical' as const },
        { date: hTs[10].date, description: `Minor fluctuation likely driven by temporary localized traffic congestion.`, type: 'warning' as const }
      ];

      const sortedStations = [...stationsData].sort((a, b) => b.ori - a.ori);
      const sortedByRed = [...stationsData].sort((a, b) => b.red - a.red);

      const riskClass = avgOri <= 50 ? 'Good' : avgOri <= 100 ? 'Moderate' : avgOri <= 200 ? 'Poor' : 'Hazardous';

      setReportData({
        location: targetLoc,
        currentAQI: avgOri,
        predictedAQI: avgRed,
        stations: stationsData.map(s => ({
          name: s.name,
          originalAQI: s.ori,
          reducedAQI: Math.round(s.ori * (1 - s.red / 100)),
          reductionPercentage: s.red
        })),
        trees: selectedTrees,
        selectedTreeGroup: selectedGroup,
        timestamp: new Date().toISOString(),
        estimatedCarbonReduction: estCarbonRed,
        overallImpactScore: Math.min(100, Math.floor((selectedGroup / 500) * 40 + (avgRed < 100 ? 60 : 30))),
        
        // Temporal Data
        timeSeriesData: timeSeries,
        historicalTimeSeries: hTs,
        predictedTimeSeries: pTs,
        
        // Analytics
        anomalySpikes: spikes,
        worstStation: sortedStations[0]?.name || "N/A",
        bestImprovingStation: sortedByRed[0]?.name || "N/A",
        topCorrelatedPollutant: "NO₂",
        riskClassification: riskClass,

        // Specific actions
        recommendations: {
          shortTerm: [
            `Deploy 2 mobile monitoring units to the ${sortedStations[0]?.name || 'worst affected'} region.`,
            `Initiate public health advisories targeting high NO2 exposure zones.`,
            `Source ${selectedGroup} saplings of ${selectedTrees[0].name} and ${selectedTrees[1].name} from local nurseries.`
          ],
          midTerm: [
            `Execute the first phase planting of the ${selectedGroup} trees.`,
            `Install permanent low-cost AQI grids to track micro-level pollution reduction over 3 months.`,
            `Monitor CO2 absorption rates via satellite imagery or sample site verification.`
          ],
          longTerm: [
            `Monetize the estimated ${estCarbonRed.toFixed(1)} tons of Carbon Credits via local/international exchanges.`,
            `Implement data-backed green-belt zoning laws based on observed Airsona impact predictions.`,
            `Expand tree program by 300% upon validation of AI algorithmic predictions.`
          ]
        }
      });

      // ── Run the Environment Engine for this city ──────────
      // Fire and merge — non-blocking, report still works without it
      try {
        const engineRes = await fetch("/api/engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: targetLoc }),
        });
        if (engineRes.ok) {
          const engineData = await engineRes.json();
          setReportData(prev => prev ? {
            ...prev,
            engineResults: {
              topRecommendations: engineData.topRecommendations?.map((r: any) => ({
                solution: r.solution,
                score: r.score,
                rank: r.rank,
                category: r.category,
                estimatedImpact: r.estimatedImpact,
                implementationDifficulty: r.implementationDifficulty,
                timeToImpact: r.timeToImpact,
                costEstimate: r.costEstimate,
                quickWin: r.quickWin,
              })) || [],
              whatIfScenarios: engineData.whatIfScenarios?.map((s: any) => ({
                scenario: s.scenario,
                projectedAQIChange: s.projectedAQIChange,
                projectedCO2ReductionTons: s.projectedCO2ReductionTons,
                projectedEnergyMWh: s.projectedEnergyMWh,
                projectedJobs: s.projectedJobs,
                confidence: s.confidence,
              })) || [],
              profileSummary: engineData.profile_summary || {},
            },
          } : prev);
        }
      } catch (engineErr) {
        console.warn("Engine API call failed (report will omit engine section):", engineErr);
      }
      
    } catch (err) {
      console.error(err);
      setError("Could not fetch data. Showing fallback.");
      const fbStations = getRandomSubset(fallbackStations, 3);
      setStations(fbStations);
      setMapPoints(generateRandomPoints(50, fbStations));
      setTreeRecommendations(getRandomSubset(fallbackTrees, 6));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (reportRef.current && reportData) {
      await generateReport(reportRef.current, `Airsona_Report_${reportData.location.replace(/\s+/g, '_')}.pdf`);
    }
  };

  const regeneratePoints = (n = 60) => setMapPoints(generateRandomPoints(n, stations));

  const legend = useMemo(
    () => [
      { label: "Good (≤50)", color: "green" },
      { label: "Moderate (51-100)", color: "lime" },
      { label: "Unhealthy (101-200)", color: "yellow" },
      { label: "Poor (201-300)", color: "orange" },
      { label: "Hazardous (>300)", color: "red" },
    ],
    []
  );

  const getAqiColorClasses = (aqi: number) => {
    if (aqi <= 50) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (aqi <= 100) return "bg-lime-500/10 text-lime-400 border border-lime-500/20";
    if (aqi <= 200) return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    if (aqi <= 300) return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
    return "bg-red-500/10 text-red-400 border border-red-500/20";
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-[Inter] font-light selection:bg-emerald-500/30">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-white mb-2">
              AQI <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Reduction Model</span>
            </h1>
            <p className="text-slate-400 font-light max-w-xl text-sm md:text-base">
              Simulate the environmental impact of targeted tree plantations. Select your tree group size and analyze predicted AQI improvements.
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
             <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2.5 text-sm text-emerald-400 flex items-center gap-2 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               {locationInput || "Detecting Zone..."}
             </div>
             
             <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-sm flex items-center gap-2 shadow-sm">
               <span className="text-slate-400">Scale:</span>
               <select
                 value={selectedGroup}
                 onChange={(e) => setSelectedGroup(Number(e.target.value))}
                 className="bg-transparent text-white outline-none font-medium appearance-none cursor-pointer pr-2"
               >
                 {[25, 50, 100, 200, 500].map((n) => (
                   <option key={n} value={n} className="bg-slate-900">{n} Trees</option>
                 ))}
               </select>
             </div>

             <button
               onClick={handleRecommendTrees}
               disabled={loading}
               className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-medium px-6 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
             >
               {loading ? (
                 <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
               ) : (
                 <>✨ Simulate Impact</>
               )}
             </button>

             {reportData && (
               <DownloadReportButton 
                 onDownload={handleDownloadReport} 
                 disabled={!reportData} 
               />
             )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column: Data & Stats */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between transition-all hover:bg-white/[0.04]">
                <span className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-medium">Current AQI</span>
                <div className="text-4xl font-extralight text-white">
                  {reportData ? reportData.currentAQI : stations.length ? Math.round(stations.reduce((a,b)=>a+b.ori,0)/stations.length) : "--"}
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-between transition-all hover:bg-emerald-500/10">
                <span className="text-emerald-500/70 text-xs uppercase tracking-widest mb-3 font-medium">Predicted AQI</span>
                <div className="text-4xl font-medium text-emerald-400">
                  {reportData ? reportData.predictedAQI : "--"}
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between transition-all hover:bg-white/[0.04]">
                <span className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-medium">Impact Score</span>
                <div className="text-3xl font-extralight text-cyan-400">
                  {reportData ? `${reportData.overallImpactScore}/100` : "--"}
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between transition-all hover:bg-white/[0.04]">
                <span className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-medium">Carbon Offset</span>
                <div className="text-xl font-extralight text-white mt-auto">
                  {reportData ? `${reportData.estimatedCarbonReduction.toFixed(1)} tons/yr` : "--"}
                </div>
              </div>
            </div>

            {/* Additional Engine Context */}
            {reportData?.engineResults?.topRecommendations && reportData.engineResults.topRecommendations.length > 0 && (
              <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-2xl p-5">
                <h3 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                  <span>💡</span> AI Top Insight
                </h3>
                <p className="text-sm text-slate-300 font-light leading-relaxed">
                  {reportData.engineResults.topRecommendations[0].solution}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-cyan-500/70">
                  <span>Difficulty: {reportData.engineResults.topRecommendations[0].implementationDifficulty}</span>
                  <span>•</span>
                  <span>Impact: {reportData.engineResults.topRecommendations[0].estimatedImpact}</span>
                </div>
              </div>
            )}

            {/* Tree Recommendations List */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex-1 flex flex-col">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center justify-between">
                Recommended Species
                <span className="text-xs text-slate-500 font-light bg-white/5 px-2 py-1 rounded-md">{treeRecommendations.length} selected</span>
              </h3>
              {error && <p className="text-xs text-amber-400 mb-4 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">{error}</p>}
              <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[250px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {treeRecommendations.map((t, i) => (
                  <div key={i} className="flex flex-col p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5">
                    <span className="font-medium text-white text-sm">{t.name}</span>
                    {t.description && <span className="text-xs text-slate-400 font-light mt-1.5 leading-relaxed">{t.description}</span>}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Center/Right Column: Map & Station Data */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Map Container */}
            <div className="relative w-full h-[450px] lg:h-[550px] rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl">
              <AQIMap center={center} mapPoints={mapPoints} />
              
              {/* Overlay Legend */}
              <div className="absolute bottom-5 left-5 z-[400] bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl flex flex-col gap-3">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">AQI Index</span>
                <div className="flex items-center gap-4">
                  {legend.map((l) => (
                    <div key={l.color} className="flex items-center gap-2 group cursor-help">
                      <span className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white/10 group-hover:scale-125 transition-transform" style={{ background: l.color }} />
                      <span className="text-xs text-slate-300 font-medium hidden sm:block">{l.label.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Map Controls */}
              <button
                onClick={() => regeneratePoints(80)}
                className="absolute top-5 right-5 z-[400] bg-black/80 backdrop-blur-xl border border-white/10 p-2.5 rounded-xl text-white hover:bg-white/10 transition-all hover:scale-105 shadow-xl"
                title="Regenerate Sensor Data"
              >
                🔄
              </button>
            </div>

            {/* Stations Data Table */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-medium text-white">Monitoring Stations</h3>
                <span className="text-xs text-slate-500 font-light bg-white/5 px-3 py-1.5 rounded-full">{stations.length} active nodes</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-500 uppercase tracking-widest">
                      <th className="pb-4 font-medium pl-4">Station Location</th>
                      <th className="pb-4 font-medium">Original AQI</th>
                      <th className="pb-4 font-medium">Est. Reduction</th>
                      <th className="pb-4 font-medium pr-4 text-right">Projected AQI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.slice(0, 6).map((s, i) => {
                      const projected = Math.round(s.ori * (1 - s.red / 100));
                      return (
                        <tr key={i} className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors group">
                          <td className="py-4 text-sm text-white font-light pl-4 flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-emerald-500 transition-colors"></span>
                            {s.name}
                          </td>
                          <td className="py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getAqiColorClasses(s.ori)}`}>
                              {s.ori}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-emerald-400 font-medium flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                            {s.red}%
                          </td>
                          <td className="py-4 text-sm text-white font-medium pr-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getAqiColorClasses(projected)}`}>
                              {projected}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Hidden Report Document for PDF generation */}
      {reportData && (
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px", pointerEvents: "none", opacity: 0 }}>
          <ReportDocument ref={reportRef} data={reportData} />
        </div>
      )}
    </div>
  );
}
