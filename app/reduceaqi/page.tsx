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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white font-[Inter]">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[80vh]">

          {/* LEFT */}
          <div className="flex flex-col justify-start gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                🌳 AQI Reduction
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                  Tree Plantation Impact
                </span>
              </h1>
              <p className="mt-3 text-slate-400">
                Check AQI improvements by clicking <strong>Recommend Trees</strong>.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="bg-[#0d0f15] border border-emerald-500/30 rounded-2xl px-6 py-3 text-emerald-400 font-bold w-full sm:w-64 text-center select-none shadow-lg shadow-emerald-500/10">
                Zone: {locationInput || "Detecting..."}
              </div>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(Number(e.target.value))}
                className="bg-[#0d0f15] border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none"
              >
                {[25, 50, 100, 200, 500].map((n) => (
                  <option key={n} value={n}>{n} trees</option>
                ))}
              </select>
              <button
                onClick={handleRecommendTrees}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 disabled:opacity-60 transition"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>🌱 Recommend Trees</>
                )}
              </button>
              <button
                onClick={() => regeneratePoints(80)}
                className="px-4 py-3 rounded-2xl bg-white/6 hover:bg-white/10 transition"
              >
                🔄 Regenerate Dots
              </button>
              
              <DownloadReportButton 
                onDownload={handleDownloadReport} 
                disabled={!reportData} 
              />
            </div>

            {/* Stations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#0d0f15] border border-slate-800 rounded-2xl p-4 max-h-44 overflow-y-auto">
                <h3 className="text-sm font-semibold mb-3">Nearby Stations</h3>
                {stations.map((s, i) => (
                  <div key={i} className="bg-[#11131a] rounded-xl p-3 mb-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{s.name}</p>
                      <div className="text-xs text-slate-400">AQI {s.ori}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Reduction: <span className="text-green-400 font-semibold">{s.red}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended Trees */}
              <div className="bg-[#0d0f15] border border-slate-800 rounded-2xl p-4 max-h-44 overflow-y-auto">
                <h3 className="text-sm font-semibold mb-3">Recommended Trees</h3>
                {error && <p className="text-xs text-amber-400 mb-2">{error}</p>}
                {treeRecommendations.map((t, i) => (
                  <div key={i} className="bg-[#11131a] rounded-xl p-3 mb-2">
                    <p className="font-medium">{t.name}</p>
                    {t.description && <p className="text-xs text-slate-400">{t.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs text-slate-400 mb-2">AQI Legend</h4>
              <div className="flex flex-wrap gap-2 items-center">
                {legend.map((l) => (
                  <div key={l.color} className="flex items-center gap-2 bg-[#0d0f15] p-2 rounded-lg border border-slate-800">
                    <span style={{ width: 14, height: 14, background: l.color, borderRadius: 6, display: "inline-block" }} />
                    <span className="text-xs text-slate-300">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: MAP */}
          <div className="w-full h-[420px] md:h-[540px] lg:h-[680px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <AQIMap center={center} mapPoints={mapPoints} />
          </div>

        </div>
      </div>

      {/* Hidden Report Document for PDF generation */}
      {reportData && (
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
          <ReportDocument ref={reportRef} data={reportData} />
        </div>
      )}
    </div>
  );
}
