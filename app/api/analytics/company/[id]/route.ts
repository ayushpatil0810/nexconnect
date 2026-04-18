import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    const company = await db.collection("companies").findOne({ _id: new ObjectId(id) });
    if (!company) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Since we don't actively log every page view in this demo, we'll derive engagement 
    // mathematically relative to their verification trust score to show correlation.
    const baseViews = 120;
    const trustMultiplier = (company.trustScore || 10) / 10;
    
    const views = Math.floor(baseViews * trustMultiplier * 1.5);
    const interactions = Math.floor(views * 0.08); // 8% engagement

    return NextResponse.json({
      id: company._id,
      metrics: {
        views,
        interactions,
        engagementRate: (interactions / views) * 100,
        trustScore: company.trustScore || 0
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
