import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getEventById, getUserRegistrationForEvent } from "@/lib/db/events";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, rating, feedback } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Ensure the event has actually occurred and marked as COMPLETED
    if (event.status !== "COMPLETED") {
      return NextResponse.json({ error: "You can only rate events that have been marked as completed by the organizer" }, { status: 400 });
    }

    const registration = await getUserRegistrationForEvent(session.user.id, eventId);
    if (!registration) {
      return NextResponse.json({ error: "You must be registered to leave feedback" }, { status: 403 });
    }

    if (registration.rating) {
      return NextResponse.json({ error: "You have already rated this event" }, { status: 400 });
    }

    const db = await getDb();

    // 1. Update the registration with feedback
    await db.collection("event_registrations").updateOne(
      { _id: new ObjectId(registration._id) },
      { $set: { rating, feedback, updatedAt: new Date() } }
    );

    // 2. Recalculate Event Trust Score
    // For simplicity: Add rating points to the event's trust score
    // 5 stars = +5, 4 = +2, 3 = +0, 2 = -2, 1 = -5
    let scoreModifier = 0;
    if (rating === 5) scoreModifier = 5;
    else if (rating === 4) scoreModifier = 2;
    else if (rating === 2) scoreModifier = -2;
    else if (rating === 1) scoreModifier = -5;

    let newTrustScore = Math.max(0, Math.min(100, (event.trustScore || 50) + scoreModifier));
    
    let newTrustLevel = event.trustLevel;
    if (newTrustScore >= 80) newTrustLevel = "TRUSTED" as any;
    else if (newTrustScore >= 40) newTrustLevel = "MODERATE" as any;
    else newTrustLevel = "UNVERIFIED" as any;

    await db.collection("events").updateOne(
      { _id: new ObjectId(eventId) },
      { $set: { trustScore: newTrustScore, trustLevel: newTrustLevel } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback submission failed:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
