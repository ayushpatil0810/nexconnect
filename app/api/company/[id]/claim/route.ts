import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDb();
    const company = await db.collection("companies").findOne({ _id: new ObjectId(id) });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Check if there is already a pending or approved claim for this user
    const existingClaim = await db.collection("ownership_claims").findOne({
      userId: session.user.id,
      companyId: id,
      status: { $in: ["PENDING", "APPROVED"] }
    });

    if (existingClaim) {
      return NextResponse.json({ error: "You already have an active claim for this organization." }, { status: 400 });
    }

    // Check if the user is already an Owner
    const reps = company.authorizedRepresentatives || [];
    if (reps.some((r: any) => r.userId === session.user.id && r.role === "Owner") || (company.creatorId === session.user.id && company.hasVerifiedOwner)) {
       return NextResponse.json({ error: "You are already a verified owner." }, { status: 400 });
    }

    const claim = {
      userId: session.user.id,
      companyId: id,
      status: "PENDING",
      faceVerified: true, // Assuming true for hackathon flow if onboarding is complete
      domainVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("ownership_claims").insertOne(claim);

    // Update company verification status to PENDING if it was UNVERIFIED
    if (company.verificationStatus === "UNVERIFIED") {
      await db.collection("companies").updateOne(
        { _id: new ObjectId(id) },
        { $set: { verificationStatus: "PENDING" } }
      );
    }

    return NextResponse.json({ success: true, claimId: result.insertedId.toString() });
  } catch (error) {
    console.error("Failed to create claim:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
