import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status } = await request.json();
    if (!status || !["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = await getDb();
    
    // Validate authorization
    const response = await db.collection("opportunity_responses").findOne({ _id: new ObjectId(id) });
    if (!response) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const opportunity = await db.collection("business_opportunities").findOne({ _id: new ObjectId(response.opportunityId) });
    if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const company = await db.collection("companies").findOne({ _id: new ObjectId(opportunity.companyId) });
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const reps = company.authorizedRepresentatives || [];
    if (!reps.find((r: any) => r.userId === company.creatorId)) {
      reps.unshift({ userId: company.creatorId, role: "Owner" });
    }

    const isAuth = reps.find((r: any) => r.userId === session.user.id);
    if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Update status
    await db.collection("opportunity_responses").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    // Notify the user who applied
    const statusText = status === "ACCEPTED" ? "accepted" : "declined";
    await db.collection("notifications").insertOne({
      userId: response.responderUserId,
      type: "SYSTEM",
      content: `${company.name} has ${statusText} your proposal for: ${opportunity.title}`,
      link: `/business`,
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("Failed to update response:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
