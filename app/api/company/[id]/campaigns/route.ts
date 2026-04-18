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

    const { title, targetAudience, budget } = await request.json();
    if (!title || !budget || budget <= 0) {
      return NextResponse.json({ error: "Invalid campaign parameters" }, { status: 400 });
    }

    const db = await getDb();
    const company = await db.collection<Company>("companies").findOne({ _id: new ObjectId(id) });
    
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

    // Create Campaign Record
    const campaignId = new ObjectId().toString();
    await db.collection("campaigns").insertOne({
      _id: new ObjectId(campaignId),
      companyId: id,
      title,
      targetAudience,
      budget,
      status: "RUNNING",
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
