import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Company } from "@/lib/types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, targetAudience, budget, postUrl } = await request.json();
    if (!title || !budget || budget <= 0) {
      return NextResponse.json({ error: "Invalid campaign parameters" }, { status: 400 });
    }

    const db = await getDb();
    const company = await db.collection("companies").findOne({ _id: new ObjectId(id) }) as Company | null;
    
    if (!company) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check auth
    const isCreator = company.creatorId === session.user.id;
    const isRep = company.authorizedRepresentatives?.some(r => r.userId === session.user.id && (r.role === "Owner" || r.role === "Admin"));
    if (!isCreator && !isRep) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check credits
    const currentCredits = company.promoCredits || 0;
    if (currentCredits < budget) {
      return NextResponse.json({ error: "Insufficient promo credits" }, { status: 400 });
    }

    // Deduct credits
    await db.collection("companies").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { promoCredits: -budget } }
    );

    // Generate mock analytics seed based on budget
    const impressionMultiplier = 8 + Math.floor(Math.random() * 12); // 8-20x budget
    const impressions = budget * impressionMultiplier;
    const ctr = 0.02 + Math.random() * 0.06; // 2-8%
    const clicks = Math.floor(impressions * ctr);
    const conversionRate = 0.01 + Math.random() * 0.04; // 1-5%
    const conversions = Math.floor(clicks * conversionRate);
    const reach = Math.floor(impressions * (0.6 + Math.random() * 0.3)); // 60-90% of impressions

    // Create Campaign Record
    const campaignId = new ObjectId().toString();
    await db.collection("campaigns").insertOne({
      _id: new ObjectId(campaignId),
      companyId: id,
      title,
      targetAudience,
      budget,
      postUrl: postUrl || null,
      status: "RUNNING",
      analytics: {
        impressions,
        clicks,
        ctr: parseFloat((ctr * 100).toFixed(2)),
        conversions,
        conversionRate: parseFloat((conversionRate * 100).toFixed(2)),
        reach,
        spent: budget,
      },
      createdAt: new Date(),
    });

    // Store Campaign Usage (Credit Deduction History)
    await db.collection("campaign_usages").insertOne({
      userId: session.user.id,
      companyId: id,
      campaignId,
      creditsUsed: budget,
      timestamp: new Date()
    });

    return NextResponse.json({ success: true, campaignId, newBalance: currentCredits - budget });

  } catch (error) {
    console.error("Failed to launch campaign", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
