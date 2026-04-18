import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 10;

    const db = await getDb();
    
    // Fetch the top users sorted by verifiedReferralCount DESC
    const topReferrers = await db.collection("profiles")
      .find({ verifiedReferralCount: { $gt: 0 } })
      .sort({ verifiedReferralCount: -1 })
      .limit(limit)
      .project({
        userId: 1,
        username: 1,
        avatarUrl: 1,
        headline: 1,
        verifiedReferralCount: 1,
      })
      .toArray();

    // Map to include rank position
    const leaderboard = topReferrers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
