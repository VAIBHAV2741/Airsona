import os
import httpx
from typing import Optional, Dict, Any

WAQI_BASE = "https://api.waqi.info"


async def fetch_current(city: str) -> Optional[Dict[str, Any]]:
    """
    Fetch current AQI + pollutant snapshot from WAQI for a city.
    Returns the raw 'data' dict on success, None on failure.
    """
    api_key = os.getenv("WAQI_API_KEY", "").strip()
    if not api_key:
        return None

    url = f"{WAQI_BASE}/feed/{city}/"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={"token": api_key})
            resp.raise_for_status()
            payload = resp.json()

        if payload.get("status") != "ok":
            return None
        return payload["data"]
    except Exception:
        return None
