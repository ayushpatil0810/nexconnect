import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRecommendations } from "@/lib/db/connection";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "5");

    const recommendations = await getRecommendations(session.user.id, limit);
    return NextResponse.json(recommendations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
