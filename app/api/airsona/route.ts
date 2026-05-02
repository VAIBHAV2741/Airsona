// app/api/airsona/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request)
 {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const res = await fetch(
      `https://airsonaapi.onrender.com/api/search?q=${encodeURIComponent(q)}`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch API" }, { status: res.status });
    }

    const data = await res.json();

    // Map `stations` to `recommendations` for frontend
    const recommendations = data.stations || [];

    return NextResponse.json({
      status: "success",
      recommendations,
    });
  } catch (err) {
    console.error("Server API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
