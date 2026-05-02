"""
Open-Meteo air quality data fetcher.
Supports up to 2 years of hourly historical data via start_date/end_date params.
"""

import httpx
import pandas as pd
from datetime import datetime, date, timedelta

AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
HOURLY_VARS = "pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide"


async def fetch_historical(
    lat: float,
    lon: float,
    days: int = 30,
) -> pd.DataFrame:
    """Fetch hourly AQ data for the past N days (max 92 via past_days param)."""
    days = min(days, 92)
    params = {
        "latitude":      lat,
        "longitude":     lon,
        "hourly":        HOURLY_VARS,
        "past_days":     days,
        "forecast_days": 1,
        "timezone":      "auto",
    }
    return await _fetch_and_parse(params)


async def fetch_historical_range(
    lat: float,
    lon: float,
    start: date,
    end: date,
) -> pd.DataFrame:
    """
    Fetch hourly AQ data for a specific date range (up to 2 years back).
    Open-Meteo air-quality history starts from 2022-07-29.
    """
    params = {
        "latitude":   lat,
        "longitude":  lon,
        "hourly":     HOURLY_VARS,
        "start_date": str(start),
        "end_date":   str(end),
        "timezone":   "auto",
    }
    return await _fetch_and_parse(params)


async def _fetch_and_parse(params: dict) -> pd.DataFrame:
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(AQ_URL, params=params)
        resp.raise_for_status()
        raw = resp.json()

    hourly = raw.get("hourly", {})
    if not hourly or "time" not in hourly:
        return pd.DataFrame()

    times = hourly["time"]
    n = len(times)

    df = pd.DataFrame({
        "datetime": pd.to_datetime(times),
        "pm25": _col(hourly, "pm2_5", n),
        "pm10": _col(hourly, "pm10", n),
        "no2":  _col(hourly, "nitrogen_dioxide", n),
        "o3":   _col(hourly, "ozone", n),
        "so2":  _col(hourly, "sulphur_dioxide", n),
        "co":   _col(hourly, "carbon_monoxide", n),
    })

    # Drop rows beyond current time (forecast window)
    df = df[df["datetime"] <= datetime.now()].copy()

    for col in ["pm25", "pm10", "no2", "o3", "so2", "co"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.ffill().bfill()
    return df.reset_index(drop=True)


def _col(hourly: dict, key: str, n: int):
    return hourly.get(key, [None] * n)
