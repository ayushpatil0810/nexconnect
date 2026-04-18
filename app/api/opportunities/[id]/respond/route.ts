import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOpportunityById, createOpportunityResponse } from "@/lib/db/opportunities";
import { getUserWithProfile } from "@/lib/db/profile";
import { getDb } from "@/lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const opportunity = await getOpportunityById(id);
    if (!opportunity || opportunity.status !== "OPEN") {
      return NextResponse.json({ error: "Opportunity is not available" }, { status: 404 });
    }

    // Verify respondent
    const responder = await getUserWithProfile(session.user.id);
    if (!responder || (!responder.onboardingComplete && responder.verificationStatus !== "VERIFIED")) {
      return NextResponse.json({ error: "You must complete profile verification to respond." }, { status: 403 });
    }

    const response = await createOpportunityResponse({
      opportunityId: id,
      responderUserId: session.user.id,
      message,
      status: "PENDING"
    });

    // Notify company owner/admin (simplified to notifying creatorId)
    const db = await getDb();
    const company = await db.collection("companies").findOne({ _id: opportunity.companyId as any });
    
    if (company) {
      await db.collection("notifications").insertOne({
        userId: company.creatorId,
        type: "SYSTEM",
        content: `New response to your opportunity: ${opportunity.title}`,
        link: `/company/${company._id.toString()}/opportunities`,
        read: false,
        createdAt: new Date()
      });
    }

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Failed to submit response:", error);
    return NextResponse.json({ error: "Failed to process response" }, { status: 500 });
  }
}
