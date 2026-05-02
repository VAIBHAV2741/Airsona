"""
Indian cities configuration + pollution-driving events for Prophet holiday regressors.

Key Indian AQI drivers:
  - Diwali firecrackers: PM2.5 spikes 5-10x
  - Stubble burning (Oct-Nov, Punjab/Haryana): severe for Delhi/Lucknow
  - Monsoon (Jun-Sep): natural washout, lowest AQI
  - Winter temperature inversion (Nov-Feb): traps pollutants
  - Summer dust storms (Mar-May): PM10 spikes
"""

import pandas as pd

INDIAN_CITIES: dict = {
    "Delhi": {
        "lat": 28.6139, "lon": 77.2090,
        "state": "Delhi",
        "stubble_impact": True,   # severely affected by Punjab stubble burning
        "typical_winter_aqi": 280,
        "typical_monsoon_aqi": 60,
    },
    "Mumbai": {
        "lat": 19.0760, "lon": 72.8777,
        "state": "Maharashtra",
        "stubble_impact": False,
        "typical_winter_aqi": 110,
        "typical_monsoon_aqi": 45,
    },
    "Kolkata": {
        "lat": 22.5726, "lon": 88.3639,
        "state": "West Bengal",
        "stubble_impact": False,
        "typical_winter_aqi": 190,
        "typical_monsoon_aqi": 55,
    },
    "Bangalore": {
        "lat": 12.9716, "lon": 77.5946,
        "state": "Karnataka",
        "stubble_impact": False,
        "typical_winter_aqi": 95,
        "typical_monsoon_aqi": 40,
    },
    "Lucknow": {
        "lat": 26.8467, "lon": 80.9462,
        "state": "Uttar Pradesh",
        "stubble_impact": True,
        "typical_winter_aqi": 260,
        "typical_monsoon_aqi": 65,
    },
    "Chennai": {
        "lat": 13.0827, "lon": 80.2707,
        "state": "Tamil Nadu",
        "stubble_impact": False,
        "typical_winter_aqi": 90,
        "typical_monsoon_aqi": 42,
    },
    "Hyderabad": {
        "lat": 17.3850, "lon": 78.4867,
        "state": "Telangana",
        "stubble_impact": False,
        "typical_winter_aqi": 105,
        "typical_monsoon_aqi": 48,
    },
    "Ahmedabad": {
        "lat": 23.0225, "lon": 72.5714,
        "state": "Gujarat",
        "stubble_impact": False,
        "typical_winter_aqi": 145,
        "typical_monsoon_aqi": 55,
    },
}


def get_indian_holidays() -> pd.DataFrame:
    """
    Returns a Prophet-compatible holiday DataFrame for Indian pollution events.
    windows represent ± days around the event where pollution is elevated.
    """
    records = [
        # Diwali — single biggest AQI spike event in India
        {"holiday": "Diwali", "ds": "2022-10-24", "lower_window": -2, "upper_window": 4},
        {"holiday": "Diwali", "ds": "2023-11-12", "lower_window": -2, "upper_window": 4},
        {"holiday": "Diwali", "ds": "2024-11-01", "lower_window": -2, "upper_window": 4},
        {"holiday": "Diwali", "ds": "2025-10-20", "lower_window": -2, "upper_window": 4},

        # Holi — burning of Holika, moderate PM2.5 spike
        {"holiday": "Holi", "ds": "2022-03-18", "lower_window": -1, "upper_window": 2},
        {"holiday": "Holi", "ds": "2023-03-08", "lower_window": -1, "upper_window": 2},
        {"holiday": "Holi", "ds": "2024-03-25", "lower_window": -1, "upper_window": 2},
        {"holiday": "Holi", "ds": "2025-03-14", "lower_window": -1, "upper_window": 2},

        # New Year's Eve — fireworks
        {"holiday": "NewYear", "ds": "2022-12-31", "lower_window": 0, "upper_window": 1},
        {"holiday": "NewYear", "ds": "2023-12-31", "lower_window": 0, "upper_window": 1},
        {"holiday": "NewYear", "ds": "2024-12-31", "lower_window": 0, "upper_window": 1},

        # Dussehra — burning of effigies
        {"holiday": "Dussehra", "ds": "2022-10-05", "lower_window": 0, "upper_window": 1},
        {"holiday": "Dussehra", "ds": "2023-10-24", "lower_window": 0, "upper_window": 1},
        {"holiday": "Dussehra", "ds": "2024-10-12", "lower_window": 0, "upper_window": 1},
    ]
    df = pd.DataFrame(records)
    df["ds"] = pd.to_datetime(df["ds"])
    return df


def is_stubble_burning_season(dt: pd.Timestamp) -> int:
    """Returns 1 if date falls in Punjab/Haryana stubble burning season (Oct 15 – Nov 30)."""
    month, day = dt.month, dt.day
    if month == 10 and day >= 15:
        return 1
    if month == 11:
        return 1
    return 0


def indian_season_label(month: int) -> str:
    if month in [12, 1, 2]:   return "Winter"
    if month in [3, 4, 5]:    return "Summer"
    if month in [6, 7, 8, 9]: return "Monsoon"
    return "Post-Monsoon"   # Oct–Nov: worst smog
