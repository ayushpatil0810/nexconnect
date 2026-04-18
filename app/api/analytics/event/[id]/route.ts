import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Determine counts from attendees array (using a mix of actual data + generated math for demo)
    const seed = parseInt(id.substring(18), 16) || 1234;
    
    // Real data if available
    let totalRegistrations = 0;
    if (event.attendees && Array.isArray(event.attendees)) {
      totalRegistrations = event.attendees.length;
    } else {
      totalRegistrations = (seed % 10) * 15 + 12; // Fallback math
    }

    // Derived Attendance (e.g., 75% show up rate)
    const attendanceCount = Math.floor(totalRegistrations * 0.75);
    
    // Derived trust impact based on successful turnout
    const trustImpact = totalRegistrations > 50 ? "+5" : totalRegistrations > 10 ? "+2" : "+0";

    return NextResponse.json({
      id: event._id,
      metrics: {
        totalRegistrations,
        attendanceCount,
        trustImpact,
        rating: (4.2 + ((seed % 10) * 0.08)).toFixed(1) // 4.2 to 4.9 rating
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
