import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { createEvent, getAllActiveEvents } from "@/lib/db/events";

export async function GET() {
  try {
    const events = await getAllActiveEvents();
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, companyId, location, locationType, date, price, category, coverImageUrl } = body;

    // Verify company ownership and verification status
    const company = await getCompanyById(companyId);
    if (!company || company.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to create events for this company" }, { status: 403 });
    }
    
    // Only verified organizations can create events
    if (company.verificationLevel !== "STRONG") {
      return NextResponse.json({ error: "Only strictly verified organizations can create events" }, { status: 403 });
    }

    const newEvent = await createEvent({
      title,
      description,
      companyId,
      location,
      locationType,
      date: new Date(date),
      price: Number(price),
      category,
      coverImageUrl
    });

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
