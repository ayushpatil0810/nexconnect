import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    // In a real system, we would query the clicks/impressions collection for this campaign
    // For demo purposes, we will fetch the campaign and derive/mock some activity based on age
    const campaign = await db.collection("campaigns").findOne({ _id: new ObjectId(id) });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Mock derived data using seed math based on campaign ID to keep it consistent
    const seed = parseInt(id.substring(18), 16) || 1234;
    const impressions = (seed % 50) * 120 + 400; // Base: 400-6400
    const clicks = Math.floor(impressions * (0.02 + ((seed % 10) * 0.01))); // 2% to 11% CTR
    
    return NextResponse.json({
      id: campaign._id,
      title: campaign.title,
      budget: campaign.budget,
      status: campaign.status,
      metrics: {
        impressions,
        clicks,
        ctr: (clicks / impressions) * 100, // Percentage
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
