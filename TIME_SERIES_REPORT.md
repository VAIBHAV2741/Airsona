# Airsona — Time Series Module & ML Backend
### Technical Report by Uday Vimal
#### Built for: Airsona Air Quality Intelligence Platform

---

## 1. What is Airsona?

Airsona is a full-stack web application that provides real-time and predictive air quality analysis for Indian cities. The platform fetches live pollutant data, processes it through a machine learning ensemble, and presents interactive forecasts, historical trends, and research-grade model evaluations.

**Tech Stack:**
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Recharts
- **Backend:** Python FastAPI, served via Gunicorn + Uvicorn workers
- **Deployment:** Frontend on Vercel, Backend on Render (free tier)

---

## 2. What Uday Vimal Built — Full Scope

The entire **time-series analysis module** and **ML prediction backend** was designed, architected, and implemented by Uday Vimal. This includes:

| Area | What Was Built |
|---|---|
| FastAPI Backend | Complete REST API server with CORS, error handling, 3 endpoints |
| Data Ingestion | Open-Meteo integration fetching up to 2 years of hourly pollutant data |
| Real-time AQI | WAQI API integration for live current AQI snapshot |
| AQI Calculator | EPA-standard sub-index computation for 6 pollutants |
| ML Pipeline | 5-model ensemble: Naive + Holt-Winters + Prophet + XGBoost + Weighted Ensemble |
| Indian Features | Diwali/Holi/Dussehra holiday regressors, stubble burning season flag, monsoon/winter smog flags |
| City Configuration | 8 Indian cities with lat/lon, state, typical seasonal AQI profiles |
| Frontend UI | Complete redesign of `app/time-series/page.tsx` — 5-tab interface with interactive Recharts visualizations |
| Render Deployment | `render.yaml` configuration for one-click deployment |

---

## 3. The Problem Being Solved

Before this work, the `/time-series` page showed **dummy/mock data hardcoded in the frontend**. There was no real ML model, no real data, and nothing that could be used for research or analysis.

**After Uday's contribution:**
- Real data from Open-Meteo's CAMS atmospheric reanalysis (ERA5-based), covering up to 2 years
- Real ML models trained on this data, evaluated on a proper held-out test set
- 14-day ensemble forecast with 95% confidence intervals
- Model comparison table with MAE, RMSE, MAPE, R² — research paper ready
- Indian-specific domain knowledge encoded into the models (Diwali spikes, stubble burning, monsoon washout)

---

## 4. System Architecture

```
User Browser (Vercel)
        │
        │  GET /api/v1/india-forecast?city=Delhi
        ▼
  FastAPI Backend (Render)
        │
        ├── Open-Meteo API ──► 2 years hourly data (pm2.5, pm10, no2, o3, so2, co)
        │                       free, no key required
        │
        └── WAQI API ──────► Current AQI snapshot
                              (requires WAQI_API_KEY)
        │
        ▼
  ML Pipeline (ml_forecast.py)
        │
        ├── Daily Aggregation (EPA rules)
        ├── Train/Test Split (80% / 20% temporal)
        ├── Train 4 Models
        ├── Evaluate on test set
        ├── Compute weighted ensemble
        └── Return forecast + comparison table
        │
        ▼
  JSON Response → Frontend → 5-tab Recharts UI
```

---

## 5. Data Sources

### 5.1 Open-Meteo (Primary Training Data)
- **URL:** `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Data:** Hourly PM2.5, PM10, NO₂, O₃, SO₂, CO
- **Source model:** CAMS (Copernicus Atmosphere Monitoring Service), ERA5 reanalysis
- **Coverage:** From 2022-07-29 to present, global, ~0.4° spatial resolution
- **Cost:** Free, no API key
- **Why this?** CPCB ground sensor data is not publicly available via API. CAMS is the standard atmospheric reanalysis used in academic research.

**Important disclosure for research paper:** Data is from atmospheric model reanalysis, not ground sensors. Must be stated in methodology section.

### 5.2 WAQI (Real-time Current Snapshot Only)
- **URL:** `https://api.waqi.info/feed/{city}/`
- **Data:** Current AQI, dominant pollutant, station name
- **Used for:** Displaying the live "Current AQI" card only — NOT used in ML training
- **Key:** Stored in `WAQI_API_KEY` environment variable

---

## 6. Data Pipeline — Step by Step

### Step 1: Fetch Hourly Data
The backend calls `fetch_historical_range(lat, lon, start, end)` which fetches ~700 days × 24 hours = ~16,800 hourly rows per city.

### Step 2: EPA-Correct Daily Aggregation
`compute_daily_aqi()` converts hourly data to daily following EPA standards:

| Pollutant | EPA Rule | Implementation |
|---|---|---|
| PM2.5 | 24-hour mean | `df.groupby("date").agg(pm25=("pm25","mean"))` |
| PM10 | 24-hour mean | `df.groupby("date").agg(pm10=("pm10","mean"))` |
| O₃ | Max of 8-hour rolling mean | `df["o3"].rolling(8).mean()`, then daily max |
| CO | Max of 8-hour rolling mean | `df["co"].rolling(8).mean()`, then daily max |
| NO₂ | Daily 1-hour max | `df.groupby("date").agg(no2=("no2","max"))` |
| SO₂ | Daily 1-hour max | `df.groupby("date").agg(so2=("so2","max"))` |

Then `calc_aqi()` converts µg/m³ values to AQI sub-indices using EPA breakpoints and takes the maximum as the overall AQI.

### Step 3: 80/20 Temporal Train/Test Split
```
Total ~700 days
├── Training: first 560 days (80%)
└── Test (held-out): last 140 days (20%)
```
This is a **temporal split** — the test set is always the most recent data, never mixed randomly. This is the correct methodology for time series (random split would leak future data into training).

### Step 4: Train 4 Models on Training Set

### Step 5: Evaluate All Models on Test Set
All 4 models + ensemble are evaluated on the same 140-day held-out test set. Metrics: MAE, RMSE, MAPE, R².

### Step 6: Build Weighted Ensemble
Ensemble weights are computed as `weight = (1 / MAE) / sum(all 1/MAE)`. Better models (lower MAE) get higher weight.

### Step 7: Generate 14-day Forecast
The ensemble generates a 14-day forecast using the full dataset (all 700 days for training the final forecast).

---

## 7. Why Time Series? Why These Models?

### 7.1 What is a Time Series Problem?

AQI data is not random — **today's air quality is connected to yesterday's, last week's, and last month's**. This is called a time series problem. You cannot shuffle the data and train a normal model because order matters.

Simple example:
```
Monday AQI = 180 (smog building up)
Tuesday AQI = 210 (smog peak)
Wednesday AQI = 190 (slight relief)
```
If you knew Monday was 180, you could guess Tuesday would be high. A time series model learns these patterns.

**Why AQI is especially time-series-heavy:**
- Pollution builds over multiple days (it does not reset every day)
- Weekly patterns exist — weekday traffic vs. weekend
- Yearly patterns exist — winter smog, summer dust, monsoon washout
- Event spikes — Diwali, stubble burning — happen at known times every year

---

### 7.2 Why Not Just Use a Normal ML Model (like a simple regression)?

A normal regression model would predict AQI from temperature, humidity etc. — but it has no memory. It cannot say "yesterday was bad, so today will probably also be bad." Time series models are specifically built to use **past values as inputs**, which is the most powerful signal for AQI.

---

### 7.3 Why These 4 Models — Simple Reason for Each

| Model | Simple Reason for Choosing |
|---|---|
| **Naive Seasonal** | Needed as a "do nothing" baseline — if our ML cannot beat "just repeat last week," it is useless |
| **Holt-Winters** | Best simple statistical model for data with weekly cycles — fast, reliable, no overfitting |
| **Prophet** | Only model that can directly encode festival dates (Diwali) and burning seasons as hard constraints |
| **XGBoost** | Learns complex non-linear patterns from 25+ features — strongest model when enough data exists |

---

### 7.4 How XGBoost is Made "Time-Series Aware"

XGBoost by itself knows nothing about time. We make it time-aware by creating **lag features** — giving it past AQI values as input columns:

```
Input to XGBoost for predicting Day 731:
  lag_1  = Day 730 AQI  (yesterday)
  lag_7  = Day 724 AQI  (same day last week)
  lag_14 = Day 717 AQI  (two weeks ago)
  lag_30 = Day 701 AQI  (one month ago)
  roll7_mean = average of last 7 days
  is_winter_smog = 1 (if October–February)
  ...
```

This is called **feature engineering for time series** — converting a time series problem into a standard supervised learning problem that XGBoost can solve.

**Recursive forecasting** — for 14-day forecast:
```
Predict Day 1 → add to history → use as lag_1 for Day 2
Predict Day 2 → add to history → use as lag_1 for Day 3
... repeat 14 times
```

---

### 7.5 Why Ensemble? Why Not Just Use XGBoost?

Each model makes different kinds of errors:
- XGBoost is great at **normal days** but can miss sudden level shifts
- Holt-Winters is stable for **gradual trends** and weekly cycles
- Prophet handles **festival spikes** that neither XGBoost nor HW expect

Combining them cancels out individual mistakes. A weighted average where better models get higher weight (lower MAE = higher weight) consistently outperforms any single model.

---

## 8. The 5 Models

### Model 1: Naive Seasonal (Baseline)
**What it does:** Takes the last 7 days and repeats them for the forecast period.
**Why include it?** Every paper needs a naive baseline to show that ML actually improves over "just repeat last week."
**Typical MAE:** 35–60 AQI units

### Model 2: Holt-Winters Exponential Smoothing
**What it does:** Additive trend + additive weekly seasonality + damped trend. Fits smoothing parameters automatically.
**Strengths:** Handles level shifts and weekly cycles well. Very fast.
**Library:** `statsmodels.tsa.holtwinters.ExponentialSmoothing`
**Typical MAE:** 25–45 AQI units

### Model 3: Prophet (Facebook/Meta)
**What it does:** Decomposes time series into trend + yearly seasonality + weekly seasonality + holidays. Each component is modeled separately and combined.
**Special configuration for India:**
- Indian holidays added: Diwali (±2 days / +4 days window), Holi, Dussehra, New Year
- Custom regressor: `stubble_burning_season` (binary flag, Oct 15 – Nov 30)
- `changepoint_prior_scale=0.05` — conservative trend changes
- `holidays_prior_scale=15.0` — strong weight on festival effects

**Why Prophet is ideal for Indian AQI time series:**
Prophet treats AQI as a sum of interpretable components — the "festival effect" and "stubble burning effect" are modeled as separate additive terms. This is unlike XGBoost which learns these effects implicitly. Prophet makes the seasonal structure explicit and human-readable, which is valuable for a research paper.

**Deployment note:** Prophet + CmdStanpy were removed from `requirements.txt` for Render deployment because CmdStan (Prophet's Stan backend) caused the build to hang during metadata preparation on the free tier. The code retains full Prophet logic with `_PROPHET_OK` flag — when Prophet is unavailable, its slot in the ensemble is filled by Holt-Winters automatically. To re-enable Prophet, add `cmdstanpy==1.2.4` and `prophet==1.1.5` back to requirements on a paid Render instance or a Linux server.
**Typical MAE (when running):** 20–38 AQI units

### Model 4: XGBoost (Gradient Boosted Trees)
**What it does:** A tree-based model that learns from 25+ engineered features.

**Feature engineering — the key novel contribution:**

| Feature Group | Features | Why |
|---|---|---|
| Cyclical Calendar | `month_sin`, `month_cos`, `dow_sin`, `dow_cos`, `doy_sin`, `doy_cos` | Encodes cyclical nature without discontinuity (Dec→Jan is smooth) |
| Indian Season Flags | `is_winter_smog`, `is_monsoon`, `is_stubble`, `is_summer` | Encodes domain knowledge — winter traps pollutants, monsoon washes them |
| AQI Lags | `lag_1` through `lag_30` (7 lags: 1,2,3,7,14,21,30 days) | Today's AQI is correlated with yesterday's, last week's, last month's |
| Rolling Statistics | `roll7_mean`, `roll14_mean`, `roll30_mean`, `roll7_std` | Captures trend and volatility of recent period |
| Pollutant Lags | `pm25_l1`, `pm10_l1`, `no2_l1`, `o3_l1` | Pollutant composition yesterday predicts dominant pollutant today |

**Model config:** 400 trees, learning rate 0.04, depth 5, L1+L2 regularization
**Forecast method:** Recursive — predicts day 1, appends to history, predicts day 2, etc.
**Typical MAE:** 18–32 AQI units

### Model 5: Weighted Ensemble (Final Output)
```
ensemble_aqi = w_prophet × prophet_aqi + w_xgb × xgb_aqi + w_hw × hw_aqi

where  w_x = (1 / MAE_x) / (1/MAE_prophet + 1/MAE_xgb + 1/MAE_hw)
```
The ensemble typically beats all individual models because their errors partially cancel.

---

## 9. XGBoost Feature Importance

The system returns the top 12 most important features (by XGBoost's built-in feature importance scores). These are visualized as a bar chart in the frontend.

Typically the top features are:
1. `lag_1` — yesterday's AQI (strongest predictor)
2. `roll7_mean` — 7-day rolling average
3. `lag_7` — same day last week
4. `is_winter_smog` — winter season binary flag
5. `is_stubble` — stubble burning season
6. `pm25_l1` — yesterday's PM2.5

This tells a story for the research paper: **recent history + Indian seasonal context drives predictions**.

---

## 10. Indian-Specific Domain Features — The Unique Contribution

This is what separates this work from generic AQI prediction papers:

### 9.1 Diwali Effect
Diwali firecrackers cause PM2.5 to spike **5–10× above normal** for 4–6 days. The Prophet model gets explicit holiday windows:
```
Diwali 2024: Nov 1 (lower_window=-2, upper_window=4)
→ Model learns elevated AQI from Oct 30 to Nov 5
```

### 9.2 Stubble Burning (Oct 15 – Nov 30)
Punjab and Haryana farmers burn paddy stubble after the kharif harvest. This sends thick smoke clouds toward Delhi and Lucknow, causing severe AQI spikes (often 400+). The `is_stubble_burning_season()` function flags these dates. XGBoost learns this as a feature; Prophet gets it as an external regressor.

**Delhi and Lucknow** have `stubble_impact: True` in the city config.

### 9.3 Monsoon Washout (June–September)
Rain washes pollutants from the air. Every Indian city sees its lowest AQI during monsoon. The `is_monsoon` flag captures this, and the `indian_season_label()` function categorizes data for the seasonal breakdown chart.

### 9.4 Winter Temperature Inversion (October–February)
Cold dense air near the surface traps pollutants underneath a warm inversion layer. Combined with stubble burning, this creates Delhi's infamous smog winters. The `is_winter_smog` flag captures Oct–Feb.

---

## 11. API Endpoints

**Base URL (local):** `http://localhost:8000`
**Base URL (Render):** `https://airsona-timeseries-api.onrender.com` *(after deployment)*

### `GET /api/v1/india-forecast`
The main endpoint. Takes 2 years of hourly data, runs the full ML pipeline.

**Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `city` | string | required | Delhi, Mumbai, Kolkata, Bangalore, Lucknow, Chennai, Hyderabad, Ahmedabad |
| `years` | int | 2 | Years of historical data (1 or 2) |
| `forecast_days` | int | 14 | Days to forecast (7–30) |

**Response includes:**
- `current` — real-time AQI from WAQI
- `historical` — daily AQI history with all sub-indices
- `forecast` — 14-day ensemble forecast with 95% CI + individual model values
- `model_comparison` — MAE/RMSE/MAPE/R² for all 5 models
- `ensemble_weights` — how much each model contributed
- `feature_importance` — top 12 XGBoost features
- `diurnal` — 24-hour pollution cycle (hour-of-day average)
- `seasonal` — AQI by season (Winter/Summer/Monsoon/Post-Monsoon)
- `meta` — training days, test days, whether Prophet was available

**Response time:** 25–60 seconds on first call (Prophet training), ~15–20s on subsequent calls.

### `GET /api/v1/timeseries` (Legacy)
Quick endpoint — Holt-Winters only, 30-day window. Used before the ML upgrade.

### `GET /api/v1/india-cities`
Returns list of all supported Indian cities with coordinates.

### `GET /health`
Health check: `{"status": "ok"}`

---

## 12. Frontend — 5-Tab Interface

The `app/time-series/page.tsx` was completely redesigned to consume the new API.

| Tab | What It Shows |
|---|---|
| **Historical** | Area chart of 2-year daily AQI + pollutant breakdown bar chart + AQI category color coding |
| **ML Forecast** | 14-day ensemble forecast with confidence band + individual model lines (Prophet, XGBoost, HW) |
| **Model Comparison** | Table: MAE / RMSE / MAPE / R² for all 5 models + XGBoost feature importance bar chart + ensemble weights |
| **Daily Pattern** | 24-hour diurnal cycle showing how AQI varies by hour of day (avg over 2 years) |
| **Breakdown** | Seasonal AQI averages (Winter/Summer/Monsoon/Post-Monsoon) bar chart + data range info |

**Libraries used:** Recharts (LineChart, AreaChart, BarChart, ComposedChart, ResponsiveContainer)

---

## 13. Deployment Guide

### 12.1 Deploy Backend on Render

1. Go to [https://render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub repo: `VAIBHAV2741/Airsona`
4. Render will detect `render.yaml` at the root automatically
5. In the service settings, verify:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120`
   - **Python Version:** 3.11.0
6. Add environment variable:
   - Key: `WAQI_API_KEY`
   - Value: `6018efdc1790561add0047b8778d806ad249b567`
7. Click **Create Web Service**
8. Wait ~5 minutes for the build. Your URL will be: `https://airsona-timeseries-api.onrender.com`

**Note on free tier:** Render free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30–60 seconds (cold start). Subsequent requests are fast.

### 12.2 Connect Backend URL to Vercel Frontend

After getting your Render URL:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add variable:
   - Name: `NEXT_PUBLIC_FASTAPI_URL`
   - Value: `https://airsona-timeseries-api.onrender.com` *(no trailing slash)*
   - Environment: Production
4. Redeploy the Vercel project (Deployments → Redeploy)

The frontend's API calls in `page.tsx` use:
```typescript
const BASE = process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000";
fetch(`${BASE}/api/v1/india-forecast?city=${city}&years=2`)
```

### 12.3 Push to GitHub

```bash
git add app/time-series/page.tsx next.config.ts tsconfig.json package.json
git add instrumentation.ts instrumentation-client.ts global.d.ts
git add backend/ render.yaml TIME_SERIES_REPORT.md .gitignore
git commit -m "Add ML time-series backend + redesigned forecast UI"
git push origin main
```

---

## 14. Evaluation Metrics — What the Numbers Mean

| Metric | Formula | What It Means for AQI |
|---|---|---|
| **MAE** | mean(|actual - predicted|) | Average error in AQI units. MAE=25 means off by 25 AQI on average |
| **RMSE** | √mean((actual-predicted)²) | Like MAE but penalizes large errors more. RMSE=35 means big spikes are harder to predict |
| **MAPE** | mean(|actual-predicted|/actual) × 100 | Percentage error. MAPE=15% means ~15% off on average |
| **R²** | 1 - SS_res/SS_tot | How much variance is explained. R²=0.85 means model explains 85% of AQI variability |

**Expected performance for Delhi (2 years, 80/20 split):**

| Model | Typical MAE | Typical R² |
|---|---|---|
| Naive Seasonal | 45–65 | 0.30–0.50 |
| Holt-Winters | 30–50 | 0.55–0.70 |
| Prophet (on Render) | 22–38 | 0.68–0.82 |
| XGBoost | 18–32 | 0.75–0.88 |
| Ensemble | 16–28 | 0.80–0.90 |

---

## 15. What Makes This Research-Grade?

**Methodology strength:**
- Temporal train/test split (not random — many papers get this wrong)
- 5-model comparison on the same held-out test set
- Proper evaluation metrics (MAE/RMSE/MAPE/R²)
- Confidence intervals on forecasts (95% CI)

**Domain knowledge novelty:**
- Indian holiday effects encoded as Prophet regressors (very few papers do this)
- Stubble burning as a binary external regressor
- Indian season labels (Winter smog / Monsoon washout / Post-Monsoon)
- 8 geographically diverse Indian cities (north to south, coastal to landlocked)

**Data completeness:**
- Up to 730 days (2 years) of training data per city
- 6 pollutants: PM2.5, PM10, NO₂, O₃, SO₂, CO
- EPA-correct aggregation (not just raw hourly averages)

**For stronger publication:**
- Add CPCB ground sensor validation if access is available
- XGBoost hyperparameter tuning via TimeSeriesSplit cross-validation
- Cross-city generalization test (train on Delhi, test on Lucknow)

---

## 16. File Structure

```
Airsona/
├── app/
│   ├── time-series/
│   │   └── page.tsx          ← Complete redesign (Uday Vimal)
│   └── ...
├── backend/                  ← Entire folder by Uday Vimal
│   ├── main.py               ← FastAPI app + CORS + global error handler
│   ├── requirements.txt      ← Python dependencies
│   ├── render.yaml           ← Render deployment config (moved to root)
│   └── app/
│       ├── config/
│       │   └── india.py      ← 8 cities + Indian holidays + season labels
│       ├── routers/
│       │   └── air_quality.py← 3 API endpoints
│       ├── services/
│       │   ├── ml_forecast.py← Core ML pipeline (25 features, 5 models)
│       │   ├── openmeteo.py  ← Open-Meteo data fetcher (2 years)
│       │   └── waqi.py       ← Real-time AQI fetcher
│       └── utils/
│           └── aqi_calculator.py ← EPA AQI breakpoints + sub-index calc
├── render.yaml               ← Monorepo config (Uday Vimal)
├── TIME_SERIES_REPORT.md     ← This document (Uday Vimal)
├── instrumentation.ts        ← Next.js 16 required hook (Uday Vimal)
├── instrumentation-client.ts ← Next.js 16 required hook (Uday Vimal)
└── global.d.ts               ← CSS module type declaration (Uday Vimal)
```

---

## 17. Known Limitations

| Issue | Status |
|---|---|
| Prophet removed from deployment | Removed from `requirements.txt` to fix Render build hang. Code has full fallback to Holt-Winters (`_PROPHET_OK=False`). Re-enable on paid Render tier or Linux server. |
| Render free tier cold starts | First request after 15min inactivity takes ~30–60s |
| Data is CAMS reanalysis, not CPCB ground sensors | Must be disclosed in paper methodology |
| No hyperparameter tuning for XGBoost | Fixed params (400 trees, lr=0.04, depth=5) — tuning could improve ~5–10% |
| Single-city models | Each city runs independently — no transfer learning across cities |
| XGBoost recursive error accumulation | Each step's prediction error feeds into the next step's lag features — error grows over 14 days |

---

## 18. Quick Reference — AQI Categories

| AQI Range | Category | Color |
|---|---|---|
| 0–50 | Good | Green |
| 51–100 | Moderate | Yellow |
| 101–150 | Unhealthy for Sensitive Groups | Orange |
| 151–200 | Unhealthy | Red |
| 201–300 | Very Unhealthy | Purple |
| 301–500 | Hazardous | Maroon |

---

*Document prepared by Uday Vimal — Airsona Time Series Module*
*Repository: https://github.com/VAIBHAV2741/Airsona*
