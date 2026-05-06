// app/api/timeseries/route.ts
import { NextResponse } from "next/server";

const AIRSONA_BASE = "https://airsona.onrender.com";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const days = searchParams.get("days") || "30";
    const forecastDays = searchParams.get("forecast_days") || "7";

    if (!city || !lat || !lon) {
      return NextResponse.json(
        { error: "Missing required parameters: city, lat, lon" },
        { status: 400 }
      );
    }

    const url = `${AIRSONA_BASE}/api/v1/timeseries?city=${encodeURIComponent(city)}&lat=${lat}&lon=${lon}&days=${days}&forecast_days=${forecastDays}`;
    const res = await fetch(url, { next: { revalidate: 600 } }); // cache 10 min

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Upstream error: ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[timeseries proxy] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET_CITIES(req: Request) {
  const res = await fetch(`${AIRSONA_BASE}/api/v1/india-cities`);
  const data = await res.json();
  return NextResponse.json(data);
}
