from __future__ import annotations

import asyncio
from datetime import date, timedelta
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from app.config.india import INDIAN_CITIES
from app.services.ml_forecast import (
    compute_daily_aqi, compute_diurnal, run_full_pipeline,
)
from app.services.openmeteo import fetch_historical, fetch_historical_range
from app.services.waqi import fetch_current
from app.utils.aqi_calculator import aqi_category, calc_aqi

router = APIRouter(tags=["Air Quality"])


# ─── Existing lightweight endpoint (Holt-Winters, 30 days) ───────────────────

@router.get("/timeseries")
async def get_timeseries(
    city: str = Query(...),
    lat:  float = Query(..., ge=-90,  le=90),
    lon:  float = Query(..., ge=-180, le=180),
    days: int   = Query(30,  ge=7,    le=92),
    forecast_days: int = Query(7, ge=1, le=14),
):
    """Quick endpoint — Holt-Winters only, 30-day window."""
    from app.services.ml_forecast import (
        compute_daily_aqi as _cda,
        compute_diurnal    as _cd,
    )
    from app.services.ml_forecast import _hw_forecast

    hourly_task = fetch_historical(lat, lon, days)
    waqi_task   = fetch_current(city)
    hourly_df, waqi_data = await asyncio.gather(hourly_task, waqi_task)

    if hourly_df.empty:
        raise HTTPException(404, "No data for this location.")

    daily_df = _cda(hourly_df)
    series   = daily_df["aqi"].values.astype(float)
    fc_vals  = _hw_forecast(series, forecast_days)
    res_std  = float((_hw_forecast(series[:-7], 7) - series[-7:]).std())
    margin   = 1.96 * res_std
    last_d   = pd.to_datetime(daily_df["date"].iloc[-1])

    forecast_list = [
        {"date": str((last_d + pd.Timedelta(days=i+1)).date()),
         "aqi":       int(round(float(fc_vals[i]))),
         "aqi_lower": max(0,   int(round(float(fc_vals[i]) - margin))),
         "aqi_upper": min(500, int(round(float(fc_vals[i]) + margin))),
         "category":  aqi_category(int(round(float(fc_vals[i]))))}
        for i in range(forecast_days)
    ]

    historical = _build_historical_rows(daily_df)
    current    = _build_current(city, waqi_data, hourly_df)
    diurnal    = _cd(hourly_df)

    return {
        "city": city, "coordinates": {"lat": lat, "lon": lon},
        "current": current, "historical": historical,
        "forecast": forecast_list, "diurnal": diurnal,
        "model": {"algorithm": "Holt-Winters", "training_days": len(series)},
    }


# ─── Research-grade endpoint (2-year data, full ensemble) ────────────────────

@router.get("/india-forecast")
async def india_forecast(
    city: str  = Query(..., description="Indian city name (case-sensitive)"),
    years: int = Query(2, ge=1, le=2, description="Years of historical data"),
    forecast_days: int = Query(14, ge=7, le=30),
):
    """
    Full ML pipeline for Indian cities.
    Fetches 1–2 years of hourly data from Open-Meteo, trains
    Naive + Holt-Winters + Prophet + XGBoost, returns weighted ensemble
    forecast + evaluation table for research paper.
    """
    cfg = INDIAN_CITIES.get(city)
    if cfg is None:
        available = list(INDIAN_CITIES.keys())
        raise HTTPException(400, f"City not found. Available: {available}")

    lat, lon = cfg["lat"], cfg["lon"]

    end_dt   = date.today()
    start_dt = end_dt - timedelta(days=365 * years)
    # Open-Meteo AQ history starts 2022-07-29
    start_dt = max(start_dt, date(2022, 7, 29))

    hourly_task = fetch_historical_range(lat, lon, start_dt, end_dt)
    waqi_task   = fetch_current(city)
    hourly_df, waqi_data = await asyncio.gather(hourly_task, waqi_task)

    if hourly_df.empty:
        raise HTTPException(404, "No data returned from Open-Meteo.")

    daily_df = compute_daily_aqi(hourly_df)

    if len(daily_df) < 60:
        raise HTTPException(422, f"Only {len(daily_df)} days available — need ≥60.")

    # Full ML pipeline (can take 20-60 s on first call due to Prophet)
    pipeline = run_full_pipeline(daily_df, forecast_days)
    diurnal  = compute_diurnal(hourly_df)
    current  = _build_current(city, waqi_data, hourly_df)

    # Season breakdown for research paper
    seasonal = _season_breakdown(daily_df)

    return {
        "city":       city,
        "state":      cfg["state"],
        "coordinates": {"lat": lat, "lon": lon},
        "data_range": {"start": str(start_dt), "end": str(end_dt),
                       "total_days": len(daily_df)},
        "current":    current,
        "historical": _build_historical_rows(daily_df),
        "forecast":   pipeline["forecast"],
        "model_comparison":   pipeline["model_comparison"],
        "ensemble_weights":   pipeline["ensemble_weights"],
        "feature_importance": pipeline["feature_importance"],
        "diurnal":    diurnal,
        "seasonal":   seasonal,
        "meta":       pipeline["meta"],
    }


# ─── City list endpoint ───────────────────────────────────────────────────────

@router.get("/india-cities")
def list_cities():
    return [
        {"city": name, "state": cfg["state"],
         "lat": cfg["lat"], "lon": cfg["lon"]}
        for name, cfg in INDIAN_CITIES.items()
    ]


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _build_historical_rows(daily_df: pd.DataFrame) -> list:
    rows = []
    for _, row in daily_df.iterrows():
        rows.append({
            "date":      str(row["date"]),
            "aqi":       int(row["aqi"]),
            "category":  aqi_category(int(row["aqi"])),
            "dominant":  row["dominant"],
            "pm25": _sf(row["pm25"]), "pm10": _sf(row["pm10"]),
            "no2":  _sf(row["no2"]),  "o3":   _sf(row["o3"]),
            "co":   _sf(row["co"]),   "so2":  _sf(row["so2"]),
            "sub_pm25": int(row["sub_pm25"]), "sub_pm10": int(row["sub_pm10"]),
            "sub_no2":  int(row["sub_no2"]),  "sub_o3":   int(row["sub_o3"]),
            "sub_co":   int(row["sub_co"]),   "sub_so2":  int(row["sub_so2"]),
        })
    return rows


def _season_breakdown(daily_df: pd.DataFrame) -> list:
    from app.config.india import indian_season_label
    df = daily_df.copy()
    df["date"]   = pd.to_datetime(df["date"])
    df["season"] = df["date"].dt.month.apply(indian_season_label)
    grp = df.groupby("season")["aqi"].agg(["mean","max","min","count"])
    return [
        {"season": s, "avg_aqi": round(float(r["mean"]),1),
         "max_aqi": int(r["max"]), "min_aqi": int(r["min"]), "days": int(r["count"])}
        for s, r in grp.iterrows()
    ]


def _build_current(city: str, waqi_data, hourly_df: pd.DataFrame) -> dict:
    if waqi_data:
        iaqi = waqi_data.get("iaqi", {})
        return {
            "aqi":      waqi_data.get("aqi"),
            "category": aqi_category(int(waqi_data.get("aqi") or 0)),
            "dominant": waqi_data.get("dominentpol"),
            "station":  waqi_data.get("city", {}).get("name", city),
            "time":     waqi_data.get("time", {}).get("s"),
            "source":   "WAQI",
            "pollutants": {k: _v(iaqi, k) for k in ["pm25","pm10","no2","o3","co","so2"]},
        }
    last = hourly_df.iloc[-1]
    r = calc_aqi(pm25=last["pm25"], pm10=last["pm10"],
                 no2_ugm3=last["no2"], o3_ugm3=last["o3"],
                 co_ugm3=last["co"],   so2_ugm3=last["so2"])
    return {
        "aqi": r["aqi"], "category": aqi_category(r["aqi"] or 0),
        "dominant": r["dominant"], "station": city,
        "time": str(last["datetime"]), "source": "Open-Meteo",
        "pollutants": {k: _sf(last[k]) for k in ["pm25","pm10","no2","o3","co","so2"]},
    }


def _sf(val) -> Optional[float]:
    try:
        v = float(val)
        return round(v, 2) if v == v else None
    except Exception:
        return None


def _v(iaqi: dict, key: str) -> Optional[float]:
    entry = iaqi.get(key, {})
    return entry.get("v") if isinstance(entry, dict) else None
