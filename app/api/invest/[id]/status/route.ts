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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();
    if (!status || !["ACTIVE", "REJECTED", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = await getDb();
    
    // Verify user is the representative (only the rep can Accept/Reject requests)
    const discussion = await db.collection("investment_discussions").findOne({ _id: new ObjectId(id) });
    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    if (discussion.representativeId !== session.user.id) {
      return NextResponse.json({ error: "Only the authorized representative can update the request status" }, { status: 403 });
    }

    await db.collection("investment_discussions").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    // Notify the investor
    const statusMessage = status === "ACTIVE" ? "accepted your investment inquiry." : "declined your investment inquiry.";
    await db.collection("notifications").insertOne({
      userId: discussion.investorId,
      type: "SYSTEM",
      content: `A representative has ${statusMessage}`,
      link: `/business/${id}`,
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Failed to update status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
