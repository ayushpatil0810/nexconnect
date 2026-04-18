import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { calculateCompanyTrustScore } from "@/lib/db/company";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportedEntityId, entityType, reason } = await request.json();

    if (!reportedEntityId || !entityType || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["USER", "COMPANY"].includes(entityType)) {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    const db = await getDb();

    // Prevent duplicate reports from the same user for the same entity
    const existingReport = await db.collection("reports").findOne({
      reporterId: session.user.id,
      reportedEntityId,
    });

    if (existingReport) {
      return NextResponse.json({ error: "You have already reported this entity" }, { status: 400 });
    }

    const report = {
      reporterId: session.user.id,
      reportedEntityId,
      entityType,
      reason,
      status: "OPEN",
      createdAt: new Date(),
    };

    const result = await db.collection("reports").insertOne(report);

    // Dynamic Trust Engine Penalty
    if (entityType === "COMPANY") {
      const company = await db.collection("companies").findOne({ _id: new ObjectId(reportedEntityId) });
      if (company) {
        // Flat penalty for being reported. In production this would be weighted by report severity.
        const penalty = 10;
        const newTrustScore = Math.max(0, (company.trustScore || calculateCompanyTrustScore(company)) - penalty);
        
        await db.collection("companies").updateOne(
          { _id: new ObjectId(reportedEntityId) },
          { $set: { trustScore: newTrustScore } }
        );
      }
    } else if (entityType === "USER") {
       const profile = await db.collection("profiles").findOne({ userId: reportedEntityId });
       if (profile) {
         const newScore = Math.max(0, (profile.trustScore || 100) - 10);
         await db.collection("profiles").updateOne(
            { userId: reportedEntityId },
            { $set: { trustScore: newScore } }
         );
       }
    }

    return NextResponse.json({ success: true, reportId: result.insertedId.toString() });
  } catch (error) {
    console.error("Failed to submit report:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
