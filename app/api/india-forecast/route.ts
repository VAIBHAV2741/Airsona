import { NextResponse } from "next/server";

const BASE = "https://airsona.onrender.com";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city         = searchParams.get("city");
    const years        = searchParams.get("years") || "2";
    const forecastDays = searchParams.get("forecast_days") || "14";

    if (!city) return NextResponse.json({ error: "Missing city" }, { status: 400 });

    const url = `${BASE}/api/v1/india-forecast?city=${encodeURIComponent(city)}&years=${years}&forecast_days=${forecastDays}`;
    const res = await fetch(url, { next: { revalidate: 900 } });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Upstream error: ${text}` }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("[india-forecast proxy]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
