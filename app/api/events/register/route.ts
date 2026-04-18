import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEventById, createRegistration, hasUserRegistered } from "@/lib/db/events";
import { sendTicketEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await request.json();
    const event = await getEventById(eventId);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.price > 0) {
      return NextResponse.json({ error: "Payment required for this event" }, { status: 400 });
    }

    const alreadyRegistered = await hasUserRegistered(session.user.id, eventId);
    if (alreadyRegistered) {
      return NextResponse.json({ error: "Already registered" }, { status: 400 });
    }

    const registration = await createRegistration(session.user.id, eventId);

    // Send Ticket Email (Non-blocking)
    try {
      await sendTicketEmail(
        session.user.email,
        session.user.name || "Attendee",
        event.title,
        registration.ticketId,
        new Date(event.date).toLocaleDateString(),
        event.locationType === "Virtual" ? "Virtual Event" : event.location
      );
      console.log(`[Email] Ticket sent to ${session.user.email} for event ${event.title}`);
    } catch (emailError) {
      console.error("[Email Error] Failed to send ticket email:", emailError);
      // We don't throw here, because the registration was already successful
    }

    return NextResponse.json({ success: true, ticket: registration });

  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
