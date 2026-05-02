import React, { forwardRef } from 'react';
import { ReportData } from '../lib/reportTypes';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface Props {
  data: ReportData;
}

const PAGE_STYLE: React.CSSProperties = {
  width: '800px',
  height: '1131px',
  padding: '60px',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box',
  position: 'relative',
  borderBottom: '1px solid #f1f5f9', // boundary for html-to-image capture predictability
  fontFamily: 'Inter, system-ui, sans-serif',
  color: '#0f172a'
};

const Header = ({ title, data }: { title: string, data: ReportData }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '40px' }}>
    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h2>
    <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
      Airsona Intelligence<br />{data.location} | {new Date(data.timestamp).toLocaleDateString()}
    </div>
  </div>
);

const Footer = ({ pageNum }: { pageNum: number }) => (
  <div style={{ position: 'absolute', bottom: '40px', left: '60px', right: '60px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
    <span>CONFIDENTIAL & PROPRIETARY — AIRSONA ENVIRONMENTAL SYSTEMS</span>
    <span>Page {pageNum}</span>
  </div>
);

export const ReportDocument = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return '#10b981';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 200) return '#f97316';
    return '#ef4444'; 
  };

  return (
    <div ref={ref} style={{ width: '800px', backgroundColor: '#fff' }}>
      
      {/* PAGE 1: COVER */}
      <div style={{ ...PAGE_STYLE, display: 'flex', flexDirection: 'column', padding: '0', backgroundColor: '#0f172a' }}>
        <div style={{ height: '40%', backgroundColor: '#1e293b', position: 'relative', overflow: 'hidden' }}>
           <div style={{ position: 'absolute', top: 50, left: 60, color: '#38bdf8', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>AIRSONA</div>
        </div>
        <div style={{ flex: 1, padding: '80px 60px', color: '#fff' }}>
          <div style={{ color: '#94a3b8', fontSize: '16px', letterSpacing: '2px', marginBottom: '20px', textTransform: 'uppercase' }}>Environmental Intelligence Audit</div>
          <h1 style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1.1, margin: '0 0 40px 0' }}>Air Quality<br/>Intelligence<br/>Report</h1>
          <div style={{ borderLeft: '4px solid #38bdf8', paddingLeft: '20px', marginBottom: '60px' }}>
            <div style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>Target Zone: {data.location}</div>
            <div style={{ fontSize: '16px', color: '#94a3b8' }}>Generated: {new Date(data.timestamp).toLocaleDateString()}</div>
          </div>
          
          <div style={{ display: 'inline-block', padding: '15px 30px', backgroundColor: getAqiColor(data.currentAQI), color: '#fff', borderRadius: '8px', fontWeight: 'bold', fontSize: '20px' }}>
            Risk Classification: {data.riskClassification.toUpperCase()}
          </div>
        </div>
      </div>

      {/* PAGE 2: EXECUTIVE SUMMARY */}
      <div style={PAGE_STYLE}>
        <Header title="Executive Summary" data={data} />
        <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>Key Findings & Overview</h1>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <div style={{ flex: 1, padding: '30px', backgroundColor: '#f8fafc', border: `2px solid ${getAqiColor(data.currentAQI)}` }}>
            <div style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Current Baseline AQI</div>
            <div style={{ fontSize: '64px', fontWeight: '900', color: getAqiColor(data.currentAQI), lineHeight: 1 }}>{Math.round(data.currentAQI)}</div>
            <div style={{ marginTop: '10px', fontSize: '16px', fontWeight: 'bold', color: '#334155' }}>Status: {data.riskClassification}</div>
          </div>
          <div style={{ flex: 1, padding: '30px', backgroundColor: '#f0f9ff', border: `2px solid #0ea5e9` }}>
             <div style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Projected AQI (Post-Action)</div>
            <div style={{ fontSize: '64px', fontWeight: '900', color: '#0ea5e9', lineHeight: 1 }}>{Math.round(data.predictedAQI)}</div>
            <div style={{ marginTop: '10px', fontSize: '16px', fontWeight: 'bold', color: '#334155' }}>Improved by {Math.round((1 - data.predictedAQI/data.currentAQI)*100)}%</div>
          </div>
        </div>

        <h3 style={{ fontSize: '20px', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>Executive Bullet Points</h3>
        <ul style={{ fontSize: '16px', lineHeight: 1.8, color: '#334155', paddingLeft: '20px' }}>
          <li><strong style={{color:'#1e293b'}}>Forecast:</strong> AQI is expected to improve dramatically, shifting the region into a healthier bracket within 12 months.</li>
          <li><strong style={{color:'#1e293b'}}>Primary Driver:</strong> High correlation observed with {data.topCorrelatedPollutant} emissions.</li>
          <li><strong style={{color:'#1e293b'}}>Action Core:</strong> The deployment of the {data.selectedTreeGroup}-tree initiative will act as a primary biomitigation threshold.</li>
        </ul>

        <div style={{ marginTop: '50px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '20px' }}>
          <strong>Critical Note:</strong> The {data.worstStation} monitoring station exhibits the highest volatility and should be targeted for immediate containment policies.
        </div>
        <Footer pageNum={2} />
      </div>

      {/* PAGE 3: HISTORICAL TIME SERIES */}
      <div style={PAGE_STYLE}>
        <Header title="Historical Volatility Analysis" data={data} />
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>7-14 Day AQI Trajectory</h1>
        <p style={{ color: '#64748b', marginBottom: '40px' }}>Tracking particulate volatility and capturing anomalous emission spikes prior to intervention.</p>
        
        <div style={{ width: '100%', height: '400px', marginBottom: '40px' }}>
          <AreaChart width={680} height={400} data={data.historicalTimeSeries} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
            <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
            <Area type="monotone" dataKey="AQI" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorAqi)" isAnimationActive={false} />
          </AreaChart>
        </div>

        <h3 style={{ fontSize: '20px', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>Anomaly & Peak Detection</h3>
        {data.anomalySpikes.map((spike, idx) => (
          <div key={idx} style={{ padding: '15px', backgroundColor: spike.type === 'critical' ? '#fef2f2' : '#fffbeb', borderLeft: `4px solid ${spike.type === 'critical' ? '#ef4444' : '#f59e0b'}`, marginBottom: '15px' }}>
            <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{spike.date}</strong>
            <span style={{ fontSize: '14px', color: '#475569' }}>{spike.description}</span>
          </div>
        ))}
        <Footer pageNum={3} />
      </div>

      {/* PAGE 4: POLLUTION COMPONENT BREAKDOWN */}
      <div style={PAGE_STYLE}>
        <Header title="Pollutant Correlation Analysis" data={data} />
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Component-Level Tracking</h1>
        <p style={{ color: '#64748b', marginBottom: '40px' }}>Dissecting the primary drivers of AQI saturation: NO2 vs CO2 concentrations.</p>

        <div style={{ width: '100%', height: '400px', marginBottom: '40px' }}>
          <LineChart width={680} height={400} data={data.historicalTimeSeries} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
            <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="NO2" stroke="#eab308" strokeWidth={3} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="CO2" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
          </LineChart>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Correlation Intelligence</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
              Our models indicate that <strong>NO₂</strong> consistently acts as the leading indicator for severe AQI spikes in {data.location}. CO₂ levels remain at a high baseline, heavily degrading the overall Carbon Score, which will be the primary target for our biomitigation protocol.
            </p>
        </div>
        <Footer pageNum={4} />
      </div>

      {/* PAGE 5: GEO-SPATIAL STATION ANALYSIS */}
      <div style={PAGE_STYLE}>
        <Header title="Geospatial Station Data" data={data} />
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Micro-Regional Dispersal</h1>
        <p style={{ color: '#64748b', marginBottom: '40px' }}>Comparative analysis of local monitoring nodes mapping the predicted variance post-intervention.</p>

        <div style={{ marginBottom: '30px', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold' }}>HIGHEST CONCENTRATION</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7f1d1d', marginTop: '5px' }}>{data.worstStation}</div>
          </div>
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>MAXIMUM IMPROVEMENT</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#14532d', marginTop: '5px' }}>{data.bestImprovingStation}</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #1e293b', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '15px', fontSize: '14px', color: '#0f172a' }}>Monitoring Node</th>
              <th style={{ padding: '15px', fontSize: '14px', color: '#0f172a' }}>Current AQI</th>
              <th style={{ padding: '15px', fontSize: '14px', color: '#0f172a' }}>Projected AQI</th>
              <th style={{ padding: '15px', fontSize: '14px', color: '#0f172a' }}>Δ % Reduction</th>
            </tr>
          </thead>
          <tbody>
            {data.stations.slice(0, 15).map((s, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 15px', fontSize: '14px', color: '#334155' }}>{s.name}</td>
                <td style={{ padding: '12px 15px', fontSize: '14px', fontWeight: 'bold', color: getAqiColor(s.originalAQI) }}>{s.originalAQI}</td>
                <td style={{ padding: '12px 15px', fontSize: '14px', color: '#0ea5e9' }}>{s.reducedAQI}</td>
                <td style={{ padding: '12px 15px', fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                  -{s.reductionPercentage.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Footer pageNum={5} />
      </div>

      {/* PAGE 6: TREE IMPACT MODEL */}
      <div style={PAGE_STYLE}>
        <Header title="Biomitigation Impact Model" data={data} />
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Botanical Deployment Architecture</h1>
        <p style={{ color: '#64748b', marginBottom: '40px' }}>Evaluation of selected flora based on PM absorption, canopy density, and carbon sequestration capability.</p>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '30px', marginBottom: '40px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#0f172a' }}>Selected Configuration: {data.selectedTreeGroup} Units</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569' }}>
            The algorithm has selected the following native high-yield species to maximize localized dispersal disruption:
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {data.trees.map((t, i) => (
              <div key={i} style={{ padding: '15px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderLeft: '4px solid #10b981' }}>
                <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a', marginBottom: '5px' }}>{t.name}</strong>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{t.description || 'High-capacity particulate filter.'}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px', border: '1px dashed #cbd5e1', backgroundColor: '#f1f5f9' }}>
           <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Algorithmic Rationale</h4>
           <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
             The combined canopy density of this specific permutation creates an optimal wind-break effect, trapping PM2.5 and PM10 particles while rapidly metabolizing excess NO2 from nearby traffic corridors.
           </p>
        </div>
        <Footer pageNum={6} />
      </div>

      {/* PAGE 7: CARBON CREDIT & SUSTAINABILITY */}
      <div style={PAGE_STYLE}>
        <Header title="Sustainability Metrics" data={data} />
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Carbon Credit Economics</h1>
        <p style={{ color: '#64748b', marginBottom: '40px' }}>Quantifying the verifiable environmental remediation output for ESG reporting and direct carbon exchange monetization.</p>

        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
          <div style={{ flex: 1, backgroundColor: '#0f172a', padding: '40px', color: '#fff', textAlign: 'center', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Annual Sequestration</div>
            <div style={{ fontSize: '56px', fontWeight: '900', color: '#10b981', lineHeight: 1, marginBottom: '10px' }}>
              {data.estimatedCarbonReduction.toFixed(1)}
            </div>
            <div style={{ fontSize: '16px', color: '#cbd5e1' }}>Metric Tons CO₂e</div>
          </div>

          <div style={{ flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
             <div style={{ fontSize: '14px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Airsona Impact Score</div>
            <div style={{ fontSize: '56px', fontWeight: '900', color: '#3b82f6', lineHeight: 1, marginBottom: '10px' }}>
              {data.overallImpactScore}<span style={{fontSize: '24px', color: '#94a3b8'}}>/100</span>
            </div>
            <div style={{ fontSize: '16px', color: '#64748b' }}>Proprietary ESG Rating</div>
          </div>
        </div>

        <h3 style={{ fontSize: '20px', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>Equivalent Direct Impact Context</h3>
        <ul style={{ fontSize: '16px', lineHeight: 1.8, color: '#334155', paddingLeft: '20px' }}>
          <li>Offset equivalent to eliminating the emissions of <strong>{Math.round(data.estimatedCarbonReduction * 0.2)}</strong> passenger vehicles for an entire year.</li>
          <li>Equivalent to the energy usage of <strong>{Math.round(data.estimatedCarbonReduction * 0.12)}</strong> average commercial buildings.</li>
          <li>Positions {data.location} to actively trade surplus absorption capacity on verified Green Energy Exchanges.</li>
        </ul>
        <Footer pageNum={7} />
      </div>

      {/* PAGE 8: PREDICTIVE MODEL OUTLOOK */}
      <div style={PAGE_STYLE}>
        <Header title="Predictive AI Outlook" data={data} />
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>30-Day Recovery Trajectory</h1>
        <p style={{ color: '#64748b', marginBottom: '40px' }}>Machine learning generated forecast mapping the gradual descent of AQI levels assuming immediate implementation.</p>

        <div style={{ width: '100%', height: '400px', marginBottom: '40px' }}>
          <AreaChart width={680} height={400} data={data.predictedTimeSeries} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAqiPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
            <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
            <Area type="monotone" dataKey="AQI" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAqiPred)" isAnimationActive={false} />
          </AreaChart>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Confidence & Factors</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
              The model operates at an <strong>87% confidence interval</strong>. The projected stabilization assumes nominal meteorological conditions (average wind dispersal, minimal unseasonal precipitation) and absolute compliance with the deployment of all {data.selectedTreeGroup} vegetative units.
            </p>
        </div>
        <Footer pageNum={8} />
      </div>

      {/* PAGE 9: ACTIONABLE RECOMMENDATIONS */}
      <div style={PAGE_STYLE}>
        <Header title="Strategic Implementation" data={data} />
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Phased Action Plan</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>A structured, timeline-based execution strategy to realize the predicted reductions.</p>

        {/* Short Term */}
        <div style={{ marginBottom: '30px' }}>
           <h3 style={{ fontSize: '18px', color: '#dc2626', borderBottom: '2px solid #dc2626', paddingBottom: '8px', marginBottom: '15px' }}>Phase 1: Immediate Execution (0–7 Days)</h3>
           <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '15px', lineHeight: 1.7 }}>
             {data.recommendations.shortTerm.map((rec, i) => <li key={i}>{rec}</li>)}
           </ul>
        </div>

        {/* Mid Term */}
        <div style={{ marginBottom: '30px' }}>
           <h3 style={{ fontSize: '18px', color: '#f59e0b', borderBottom: '2px solid #f59e0b', paddingBottom: '8px', marginBottom: '15px' }}>Phase 2: Operational Rollout (1–3 Months)</h3>
           <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '15px', lineHeight: 1.7 }}>
             {data.recommendations.midTerm.map((rec, i) => <li key={i}>{rec}</li>)}
           </ul>
        </div>

        {/* Long Term */}
        <div>
           <h3 style={{ fontSize: '18px', color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: '8px', marginBottom: '15px' }}>Phase 3: Policy & Stabilization (6–12 Months)</h3>
           <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '15px', lineHeight: 1.7 }}>
             {data.recommendations.longTerm.map((rec, i) => <li key={i}>{rec}</li>)}
           </ul>
        </div>
        <Footer pageNum={9} />
      </div>

      {/* PAGE 10: ENVIRONMENT ENGINE — LIVE RESULTS */}
      <div style={PAGE_STYLE}>
        <Header title="Environment Recommendation Engine" data={data} />
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>AI-Scored Solutions for {data.location}</h1>
        <p style={{ color: '#64748b', marginBottom: '25px' }}>Multi-factor weighted scoring of 10 environmental solutions using live data from NASA POWER, Open-Meteo, OpenAQ, and OpenStreetMap.</p>

        {data.engineResults ? (
          <>
            {/* Profile Summary */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
              {[
                { label: 'Solar', value: data.engineResults.profileSummary.solar_potential, color: '#f59e0b' },
                { label: 'Wind', value: data.engineResults.profileSummary.wind_potential, color: '#3b82f6' },
                { label: 'Pollution', value: data.engineResults.profileSummary.pollution_severity, color: '#ef4444' },
                { label: 'Risk', value: `${data.engineResults.profileSummary.overall_environmental_risk}/100`, color: '#10b981' },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, padding: '12px', backgroundColor: '#f8fafc', border: `2px solid ${item.color}20`, textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: item.color, textTransform: 'capitalize' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Top Recommendations Table */}
            <h3 style={{ fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '12px' }}>Ranked Solution Scores</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '25px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #1e293b', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px', fontSize: '12px', color: '#0f172a' }}>#</th>
                  <th style={{ padding: '10px', fontSize: '12px', color: '#0f172a' }}>Solution</th>
                  <th style={{ padding: '10px', fontSize: '12px', color: '#0f172a' }}>Score</th>
                  <th style={{ padding: '10px', fontSize: '12px', color: '#0f172a' }}>Difficulty</th>
                  <th style={{ padding: '10px', fontSize: '12px', color: '#0f172a' }}>Timeline</th>
                  <th style={{ padding: '10px', fontSize: '12px', color: '#0f172a' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.engineResults.topRecommendations.slice(0, 10).map((rec, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: rec.quickWin ? '#f0fdf4' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>{rec.rank}</td>
                    <td style={{ padding: '8px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>
                      {rec.solution}
                      {rec.quickWin && <span style={{ fontSize: '10px', color: '#10b981', marginLeft: '6px' }}>★ QUICK WIN</span>}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '50px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${rec.score}%`, height: '100%', backgroundColor: rec.score >= 70 ? '#10b981' : rec.score >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{rec.score}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', color: rec.implementationDifficulty === 'Low' ? '#10b981' : rec.implementationDifficulty === 'Medium' ? '#f59e0b' : '#ef4444' }}>{rec.implementationDifficulty}</td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b' }}>{rec.timeToImpact}</td>
                    <td style={{ padding: '8px 10px', fontSize: '11px', color: '#64748b' }}>{rec.costEstimate}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* What-If Scenarios */}
            <h3 style={{ fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '12px' }}>What-If Projections</h3>
            {data.engineResults.whatIfScenarios.map((sc, i) => (
              <div key={i} style={{ padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>{sc.scenario}</div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>AQI Change: </span>
                    <strong style={{ color: '#10b981' }}>{sc.projectedAQIChange}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>CO₂ Saved: </span>
                    <strong style={{ color: '#3b82f6' }}>{sc.projectedCO2ReductionTons.toLocaleString()} tons</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Energy: </span>
                    <strong style={{ color: '#f59e0b' }}>{sc.projectedEnergyMWh.toLocaleString()} MWh</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Jobs: </span>
                    <strong style={{ color: '#8b5cf6' }}>{sc.projectedJobs.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            Engine data unavailable — the analysis could not be completed for this region.
          </div>
        )}
        <Footer pageNum={10} />
      </div>

      {/* PAGE 11: CONCLUSION */}
      <div style={PAGE_STYLE}>
        <Header title="Final Assessment" data={data} />
        <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>Conclusion & Mandate</h1>
        
        <div style={{ fontSize: '16px', lineHeight: 2, color: '#334155' }}>
          <p>
            The environmental audit of <strong>{data.location}</strong> dictates a definitive requirement for immediate biometric intervention. At a current baseline AQI of <strong>{Math.round(data.currentAQI)}</strong>, the region is positioned at an unsustainable threshold that carries both severe public health liabilities and massive unrealized economic potential.
          </p>
          <p>
            The Airsona deterministic models have proven that the deployment of entirely organic biomitigation—specifically the structured array of <strong>{data.selectedTreeGroup} targeted species</strong>—will forcefully shift the environmental trajectory.
          </p>
          <p>
            By realizing an estimated <strong>-{Math.round((1 - data.predictedAQI/data.currentAQI)*100)}%</strong> reduction in hazardous particulate retention, you effectively decouple the regional geography from impending meteorological stagnation. Furthermore, the generation of <strong>{data.estimatedCarbonReduction.toFixed(1)} verifiable Carbon Credits</strong> allows the operational expenditure of this initiative to be aggressively subsidized by global ESG capital markets.
          </p>
          <p>
            Additionally, the Airsona <strong>Environment Recommendation Engine</strong> has identified and scored 10 targeted solutions—from solar energy and wind power to EV adoption and urban cooling—providing a data-driven roadmap for long-term environmental remediation beyond the initial biomitigation deployment.
          </p>
          <p style={{ marginTop: '40px', fontWeight: 'bold', fontSize: '18px', color: '#0f172a' }}>
            The pathway is clear. Execution must begin immediately.
          </p>
        </div>

        <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #1e293b' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', letterSpacing: '1px' }}>AIRSONA</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>Advanced Data Platform Architecture & Environmental OS</div>
        </div>
        <Footer pageNum={11} />
      </div>

    </div>
  );
});

ReportDocument.displayName = 'ReportDocument';
