export interface ReportStation {
  name: string;
  originalAQI: number;
  reducedAQI: number;
  reductionPercentage: number;
}

export interface ReportTree {
  name: string;
  description?: string;
}

export interface ReportData {
  location: string;
  currentAQI: number;
  predictedAQI: number;
  stations: ReportStation[];
  trees: ReportTree[];
  selectedTreeGroup: number;
  timestamp: string;
  estimatedCarbonReduction: number;
  overallImpactScore: number;
  
  // Temporal Data
  timeSeriesData: { day: string; AQI: number; NO2: number; CO2: number; CarbonScore: number; }[];
  historicalTimeSeries: { date: string; AQI: number; NO2: number; CO2: number; }[];
  predictedTimeSeries: { date: string; AQI: number; }[];
  
  // Analytics & Insights
  anomalySpikes: { date: string; description: string; type: 'warning' | 'critical'; }[];
  worstStation: string;
  bestImprovingStation: string;
  topCorrelatedPollutant: string;
  riskClassification: 'Good' | 'Moderate' | 'Poor' | 'Hazardous';
  
  // Narrative Action Plan
  recommendations: {
    shortTerm: string[];
    midTerm: string[];
    longTerm: string[];
  };

  // Environment Engine Results (optional — populated when engine API succeeds)
  engineResults?: {
    topRecommendations: {
      solution: string;
      score: number;
      rank: number;
      category: string;
      estimatedImpact: string;
      implementationDifficulty: string;
      timeToImpact: string;
      costEstimate: string;
      quickWin: boolean;
    }[];
    whatIfScenarios: {
      scenario: string;
      projectedAQIChange: number;
      projectedCO2ReductionTons: number;
      projectedEnergyMWh: number;
      projectedJobs: number;
      confidence: string;
    }[];
    profileSummary: {
      solar_potential: string;
      wind_potential: string;
      pollution_severity: string;
      urbanization: string;
      overall_environmental_risk: number;
    };
  };
}
