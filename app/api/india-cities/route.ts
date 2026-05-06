// app/api/india-cities/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://airsona.onrender.com/api/v1/india-cities", {
      next: { revalidate: 86400 }, // cache 24h – cities list rarely changes
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[india-cities proxy] error:", err);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
