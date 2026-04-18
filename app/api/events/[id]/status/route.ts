import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEventById } from "@/lib/db/events";
import { getCompanyById } from "@/lib/db/company";
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

    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const company = await getCompanyById(event.companyId);
    if (!company || company.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { status } = await request.json();
    
    const validStatuses = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED", "FLAGGED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    // Trigger Notification for Feedback on Completion
    if (status === "COMPLETED") {
      const attendees = await db.collection("event_registrations").find({ 
        eventId: id,
        status: { $in: ["VALID", "CHECKED_IN"] }
      }).toArray();

      if (attendees.length > 0) {
        const notifications = attendees.map(attendee => ({
          userId: attendee.userId,
          type: "SYSTEM",
          content: `${event.title} has concluded! Please submit your feedback and rating to unlock trust points.`,
          link: `/events/${id}`,
          read: false,
          createdAt: new Date()
        }));

        await db.collection("notifications").insertMany(notifications);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Failed to update event status:", error);
    return NextResponse.json({ error: "Failed to update event status" }, { status: 500 });
  }
}
