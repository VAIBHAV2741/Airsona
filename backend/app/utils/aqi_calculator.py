from typing import Optional
import numpy as np

# EPA AQI breakpoints: (C_low, C_high, AQI_low, AQI_high)

PM25_BP = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 350.4, 301, 400),
    (350.5, 500.4, 401, 500),
]

PM10_BP = [
    (0, 54, 0, 50),
    (55, 154, 51, 100),
    (155, 254, 101, 150),
    (255, 354, 151, 200),
    (355, 424, 201, 300),
    (425, 504, 301, 400),
    (505, 604, 401, 500),
]

# NO2: ppb (1h avg) — Open-Meteo gives µg/m³, divide by 1.913
NO2_BP = [
    (0, 53, 0, 50),
    (54, 100, 51, 100),
    (101, 360, 101, 150),
    (361, 649, 151, 200),
    (650, 1249, 201, 300),
    (1250, 1649, 301, 400),
    (1650, 2049, 401, 500),
]

# O3: ppb (8h avg) — Open-Meteo gives µg/m³, divide by 1.9957
O3_BP = [
    (0, 54, 0, 50),
    (55, 70, 51, 100),
    (71, 85, 101, 150),
    (86, 105, 151, 200),
    (106, 200, 201, 300),
    (201, 404, 301, 500),
]

# CO: ppm (8h avg) — Open-Meteo gives µg/m³, divide by 1145.4
CO_BP = [
    (0.0, 4.4, 0, 50),
    (4.5, 9.4, 51, 100),
    (9.5, 12.4, 101, 150),
    (12.5, 15.4, 151, 200),
    (15.5, 30.4, 201, 300),
    (30.5, 40.4, 301, 400),
    (40.5, 50.4, 401, 500),
]

# SO2: ppb (1h avg) — Open-Meteo gives µg/m³, divide by 2.664
SO2_BP = [
    (0, 35, 0, 50),
    (36, 75, 51, 100),
    (76, 185, 101, 150),
    (186, 304, 151, 200),
    (305, 604, 201, 300),
    (605, 804, 301, 400),
    (805, 1004, 401, 500),
]


def _interpolate(c: float, bp: list) -> int:
    for c_lo, c_hi, aqi_lo, aqi_hi in bp:
        if c_lo <= c <= c_hi:
            return round((aqi_hi - aqi_lo) / (c_hi - c_lo) * (c - c_lo) + aqi_lo)
    return 500 if c > bp[-1][1] else 0


def calc_aqi(
    pm25: Optional[float] = None,
    pm10: Optional[float] = None,
    no2_ugm3: Optional[float] = None,
    o3_ugm3: Optional[float] = None,
    co_ugm3: Optional[float] = None,
    so2_ugm3: Optional[float] = None,
) -> dict:
    """
    Compute overall AQI + per-pollutant sub-AQIs from raw concentrations.
    PM2.5/PM10 are µg/m³. NO2, O3, CO, SO2 are µg/m³ and get unit-converted.
    """
    sub: dict[str, int] = {}

    def _safe(val: Optional[float]) -> Optional[float]:
        if val is None:
            return None
        v = float(val)
        return None if (np.isnan(v) or np.isinf(v)) else max(0.0, v)

    if (v := _safe(pm25)) is not None:
        sub["pm25"] = _interpolate(v, PM25_BP)
    if (v := _safe(pm10)) is not None:
        sub["pm10"] = _interpolate(v, PM10_BP)
    if (v := _safe(no2_ugm3)) is not None:
        sub["no2"] = _interpolate(v / 1.913, NO2_BP)
    if (v := _safe(o3_ugm3)) is not None:
        sub["o3"] = _interpolate(v / 1.9957, O3_BP)
    if (v := _safe(co_ugm3)) is not None:
        sub["co"] = _interpolate(v / 1145.4, CO_BP)
    if (v := _safe(so2_ugm3)) is not None:
        sub["so2"] = _interpolate(v / 2.664, SO2_BP)

    if not sub:
        return {"aqi": None, "dominant": None, "sub_aqis": {}}

    dominant = max(sub, key=sub.get)
    return {"aqi": max(sub.values()), "dominant": dominant, "sub_aqis": sub}


def aqi_category(aqi: int) -> str:
    if aqi <= 50:   return "Good"
    if aqi <= 100:  return "Moderate"
    if aqi <= 150:  return "Unhealthy for Sensitive Groups"
    if aqi <= 200:  return "Unhealthy"
    if aqi <= 300:  return "Very Unhealthy"
    return "Hazardous"
