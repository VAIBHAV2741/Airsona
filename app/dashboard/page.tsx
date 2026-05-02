"use client";

import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Generator for "genuine-feeling" deterministic data based on location
const generateDeterministicData = (location: string, length = 7) => {
  const data = [];
  const base = location.length * 13;
  const timeSeed = Math.floor(Date.now() / 600000); 

  for (let i = 0; i < length; i++) {
    const factor = (i + 1) * 5;
    const seed = (base + factor + timeSeed * 7) % 100;
    
    // Smooth trend progression
    const offset = i * 2;
    data.push({
      plantation: 100 + (seed * 2) + offset * 10,
      aqiImprovement: Math.max(1, Math.floor(seed * 0.2)) + offset,
      carbonCredits: Math.max(1, (seed * 0.05) + (offset * 0.3)),
      performance: 300 + seed * 3 + offset * 15,
      lastMonthPerformance: 250 + seed * 2 + offset * 10,
      transactions: Math.max(1, Math.floor(seed * 0.3)) + offset
    });
  }
  return data;
};

// Chart helpers — light green theme
function barChartOptions(data: number[]): Highcharts.Options {
  return {
    chart: { type: "column", height: 60, backgroundColor: "transparent" },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: { visible: false },
    yAxis: { visible: false },
    legend: { enabled: false },
    series: [
      {
        type: "column",
        data,
        color: "#3ABF37", // Light green
        borderRadius: 4,
      },
    ],
  };
}

const performanceOptions = (current: number[], lastMonth: number[]): Highcharts.Options => ({
  chart: { type: "line", backgroundColor: "transparent", height: 180 },
  title: { text: undefined },
  credits: { enabled: false },
  xAxis: {
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    labels: { style: { color: "#4A4A4A" } },
  },
  yAxis: { visible: false },
  series: [
    { type: "line", name: "This month", data: current, color: "#2C8C28" },
    { type: "line", name: "Last month", data: lastMonth, color: "#8FD694" },
  ],
  legend: { enabled: false },
});

const transactionsOptions = (data: number[]): Highcharts.Options => ({
  chart: { type: "column", backgroundColor: "transparent", height: 120 },
  title: { text: undefined },
  credits: { enabled: false },
  xAxis: {
    categories: data.map((_, i) =>
      i === data.length - 1 ? "Today" : `Day ${i + 1}`
    ),
    labels: { enabled: false },
  },
  yAxis: { visible: false },
  series: [
    { type: "column", data: data, color: "#3ABF37", borderRadius: 4 },
  ],
});

// Tailwind class shortcuts — light green theme
const card = "bg-white rounded-xl shadow p-5 flex flex-col gap-2 border border-[#C9F4C7]";
const statValue = "text-2xl font-bold tracking-tight text-[#226122]";
const statLabel = "text-xs text-gray-500";
const grid = "grid gap-6";
const labelUp = "text-xs text-green-600 ml-2";

export default function DashboardPage() {
  const [locationInput, setLocationInput] = useState<string>("Delhi");
  const [loading, setLoading] = useState(false);
  
  // States spanning the generated deterministic data
  const [dataPayload, setDataPayload] = useState(() => generateDeterministicData("Delhi", 16));

  const handleUpdateDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setDataPayload(generateDeterministicData(locationInput, 16));
      setLoading(false);
    }, 600);
  };

  const getMetricSequence = (key: keyof typeof dataPayload[0], length = 7) => 
    dataPayload.slice(0, length).map(d => d[key]);

  const plantationData = getMetricSequence("plantation");
  const aqiImprovementData = getMetricSequence("aqiImprovement");
  const carbonCreditsData = getMetricSequence("carbonCredits").map(Number);
  const performanceData = getMetricSequence("performance");
  const lastMonthPerformanceData = getMetricSequence("lastMonthPerformance");
  const transactionsData = getMetricSequence("transactions", 16);

  const latestStats = {
    plantation: plantationData[plantationData.length - 1].toLocaleString(),
    aqi: `${aqiImprovementData[aqiImprovementData.length - 1]}%`,
    carbon: `${carbonCreditsData[carbonCreditsData.length - 1].toFixed(1)} Tons`,
    perf: performanceData[performanceData.length - 1]
  };

  return (
    <div style={{ minHeight: "100vh" }} className="bg-[#d6ecd2] p-6">
      <div className="flex gap-4">
        {/* Sidebar */}
        <aside
          style={{ minWidth: 220 }}
          className="bg-white rounded-xl p-4 flex flex-col gap-2 text-[#226122] border border-[#C9F4C7]"
        >
          <div className="font-bold text-lg flex items-center gap-2 mb-3">
            <svg width={28} height={28} fill="#3ABF37">
              <rect width={28} height={28} rx={8} />
            </svg>
            Green Dashboard
          </div>

          <nav className="flex flex-col gap-1 text-gray-700">
            <div className="font-medium bg-[#E3FFE1] py-1.5 rounded-md pl-3 shadow inline-block mb-2 text-[#226122]">
              Overview
            </div>
            <div className="hover:text-[#226122] cursor-pointer">Plantation</div>
            <div className="hover:text-[#226122] cursor-pointer">AQI Levels</div>
            <div className="hover:text-[#226122] cursor-pointer">Carbon Credits</div>
            <div className="hover:text-[#226122] cursor-pointer">Reports</div>
          </nav>

          <div className="mt-5 font-semibold text-gray-600">Analytics</div>
          <nav className="ml-2 text-gray-700">
            <div className="hover:text-[#226122] cursor-pointer">Monthly</div>
            <div className="hover:text-[#226122] cursor-pointer">Yearly</div>
          </nav>

          <div className="mt-5 font-semibold text-gray-600">Environment Zones</div>
          <nav className="ml-2 text-gray-700">
            <div className="hover:text-[#226122] cursor-pointer">Zone A</div>
            <div className="hover:text-[#226122] cursor-pointer">Zone B</div>
            <div className="hover:text-[#226122] cursor-pointer">Zone C</div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-xl font-semibold text-[#226122]">
                Welcome, Vaibhav 🌱
              </div>
              <div className="text-xs text-gray-600">Eco Performance Overview for {locationInput}</div>
            </div>
            
            <form onSubmit={handleUpdateDashboard} className="flex gap-2">
              <input 
                type="text" 
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="City Name"
                className="px-3 py-1.5 rounded bg-white border border-[#C9F4C7] text-sm text-[#226122] outline-none"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-1.5 bg-[#3ABF37] text-white rounded text-sm hover:bg-[#2C8C28] disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Fetch Analytics'}
              </button>
            </form>
          </div>

          {/* Top Stats */}
          <div className={`${grid} grid-cols-3`}>
            <div className={card}>
              <span className={statLabel}>Trees Planted</span>
              <span className={statValue}>{latestStats.plantation}</span>
              <span className={labelUp}>+12% vs. last month</span>
              <HighchartsReact highcharts={Highcharts} options={barChartOptions(plantationData)} />
            </div>

            <div className={card}>
              <span className={statLabel}>AQI Improvement</span>
              <span className={statValue}>{latestStats.aqi}</span>
              <span className={labelUp}>+5% better</span>
              <HighchartsReact highcharts={Highcharts} options={barChartOptions(aqiImprovementData)} />
            </div>

            <div className={card}>
              <span className={statLabel}>Carbon Credits Earned</span>
              <span className={statValue}>{latestStats.carbon}</span>
              <span className={labelUp}>+9% increase</span>
              <HighchartsReact highcharts={Highcharts} options={barChartOptions(carbonCreditsData)} />
            </div>
          </div>

          {/* Performance + Transactions */}
          <div className={`${grid} grid-cols-2`}>
            <div className={card}>
              <span className={statLabel}>Overall Eco Performance</span>
              <span className={statValue}>{latestStats.perf}</span>
              <HighchartsReact highcharts={Highcharts} options={performanceOptions(performanceData, lastMonthPerformanceData)} />
              <div className="flex text-xs mt-2 text-gray-600">
                <div className="mr-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-1"></span>
                  This month
                </div>
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-300 mr-1"></span>
                  Last month
                </div>
              </div>
            </div>

            <div className={card}>
              <span className={statLabel}>Weekly Plantation Activity</span>
              <span className={statValue}>
                {transactionsData.reduce((a, b) => a + b, 0)}{" "}
                <span className="text-xs font-normal text-[#226122]">
                  last period: {transactionsData.reduce((a, b) => a + b, 0) - 20}
                </span>
              </span>
              <HighchartsReact highcharts={Highcharts} options={transactionsOptions(transactionsData)} />
              <div className="flex gap-6 mt-2 text-xs text-gray-600">
                <span>125 Verified</span>
                <span>13 Pending</span>
                <span>30 New</span>
              </div>
            </div>
          </div>

          {/* Lower Tiles */}
          <div className={`${grid} grid-cols-3`}>
            <div className={card}>
              <span className={statLabel}>Top Performing Zone</span>
              <div className="text-3xl text-[#226122] mt-4 mb-3 flex items-center justify-center h-20">
                Zone A
              </div>
            </div>

            <div className={card}>
              <span className={statLabel}>Total Carbon Saved</span>
              <div className="text-4xl text-[#226122] mt-4 mb-3 flex items-center justify-center h-20">
                27 Tons
              </div>
            </div>

            <div className={card}>
              <span className={statLabel}>Expected Increase</span>
              <div className="flex justify-between items-end h-20">
                <div className="text-center">
                  <div className="text-lg text-[#226122]">12%</div>
                  <div className="text-xs text-gray-500">Projected Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-lg text-[#226122]">18%</div>
                  <div className="text-xs text-gray-500">Goal</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
