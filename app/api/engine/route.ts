// app/api/engine/route.ts
// API endpoint for the Airsona Environmental Recommendation Engine
import { NextResponse } from "next/server";
import { buildEnvironmentalProfile } from "../../engine/lib/data.aggregator";
import { runRecommendationEngine } from "../../engine/lib/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { city } = body;

    if (!city || typeof city !== "string" || !city.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid 'city' field" },
        { status: 400 }
      );
    }

    // Step 1: Build environmental profile from live APIs
    const profile = await buildEnvironmentalProfile(
      { city: city.trim() },
      process.env.OPENWEATHER_API_KEY
    );

    // Step 2: Run the recommendation engine
    const result = runRecommendationEngine(profile);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Engine API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
