import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const db = await getDb();
    
    const profile = await db.collection("profiles").findOne({ userId });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const total = profile.referralCount || 0;
    const verified = profile.verifiedReferralCount || 0;
    
    // Derived Metrics
    const conversionRate = total > 0 ? (verified / total) * 100 : 0;
    
    // Milestone calculations
    const MILESTONES = [1, 5, 10, 50, 100];
    const currentMilestone = MILESTONES.slice().reverse().find(m => verified >= m) || 0;
    const nextMilestone = MILESTONES.find(m => verified < m) || 100;
    const progressToNext = verified >= 100 ? 100 : (verified / nextMilestone) * 100;

    return NextResponse.json({
      userId,
      metrics: {
        total,
        verified,
        conversionRate,
        currentMilestone,
        nextMilestone,
        progressToNext
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
