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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    const db = await getDb();
    
    // Verify user is part of the discussion
    const discussion = await db.collection("investment_discussions").findOne({ _id: new ObjectId(id) });
    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    if (discussion.investorId !== session.user.id && discussion.representativeId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (discussion.status !== "ACTIVE") {
      return NextResponse.json({ error: "Discussion is not active" }, { status: 400 });
    }

    const message = {
      discussionId: id,
      senderId: session.user.id,
      content,
      createdAt: new Date()
    };

    const result = await db.collection("investment_messages").insertOne(message);
    
    // Update discussion timestamp
    await db.collection("investment_discussions").updateOne(
      { _id: new ObjectId(id) },
      { $set: { updatedAt: new Date() } }
    );

    // Get recipient ID
    const recipientId = session.user.id === discussion.investorId ? discussion.representativeId : discussion.investorId;

    // Optional: Notify recipient
    await db.collection("notifications").insertOne({
      userId: recipientId,
      type: "SYSTEM",
      content: `New message received in investment discussion.`,
      link: `/business/${id}`,
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: { ...message, _id: result.insertedId.toString() } 
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
