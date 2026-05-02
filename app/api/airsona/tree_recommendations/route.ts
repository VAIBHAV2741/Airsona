import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const location = url.searchParams.get("location") || "Delhi";

  try {
    const res = await fetch(
      `https://airsonaapi.onrender.com/tree_recommendations?location=${encodeURIComponent(location)}`
    );

    if (!res.ok) throw new Error("API failed");

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch API" }, { status: 500 });
  }
}
