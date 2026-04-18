import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { getCompanyById } from "@/lib/db/company";
import { getUserWithProfile } from "@/lib/db/profile";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId, repId, message } = await request.json();

    const company = await getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // STRICT TRUST GUARD: Company must have a verified owner to receive investment requests
    if (!company.hasVerifiedOwner && company.verificationStatus !== "VERIFIED") {
      return NextResponse.json({ error: "Access restricted to verified organization representatives" }, { status: 403 });
    }

    // Verify target is an authorized rep with proper roles
    let reps = company.authorizedRepresentatives || [];
    if (!reps.find(r => r.userId === company.creatorId)) {
      reps.unshift({ userId: company.creatorId, role: "Owner" });
    }

    const targetRep = reps.find(r => r.userId === repId);
    if (!targetRep) {
      return NextResponse.json({ error: "Target user is not an authorized representative of this company" }, { status: 403 });
    }

    // STRICT ROLE GUARD: Only OWNER or REPRESENTATIVE can handle investment discussions
    if (targetRep.role !== "Owner" && targetRep.role !== "Representative" && targetRep.role !== "Admin") {
      return NextResponse.json({ error: "Only verified organization representatives can perform this action" }, { status: 403 });
    }

    // Ensure investor is somewhat verified (anti-broker check)
    const investorProfile = await getUserWithProfile(session.user.id);
    if (!investorProfile || (!investorProfile.onboardingComplete && investorProfile.verificationStatus !== "VERIFIED")) {
      return NextResponse.json({ error: "Investors must complete verification before initiating contact" }, { status: 403 });
    }

    const db = await getDb();

    // Create the discussion thread
    const discussion = {
      companyId,
      investorId: session.user.id,
      representativeId: repId,
      status: "REQUESTED",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("investment_discussions").insertOne(discussion);

    // Create the first message in the discussion
    await db.collection("investment_messages").insertOne({
      discussionId: result.insertedId.toString(),
      senderId: session.user.id,
      content: message,
      createdAt: new Date()
    });

    // Optionally create a notification for the representative
    await db.collection("notifications").insertOne({
      userId: repId,
      type: "SYSTEM",
      content: `${investorProfile.name || "A verified investor"} has initiated an investment discussion regarding ${company.name}.`,
      link: `/investments/${result.insertedId.toString()}`,
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, discussionId: result.insertedId.toString() });
  } catch (error) {
    console.error("Investment request failed:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
