import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateConnectionStatus } from "@/lib/db/connection";
import { ConnectionStatus } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body; // "ACCEPT" or "REJECT"

    if (action !== "ACCEPT" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const newStatus = action === "ACCEPT" ? ConnectionStatus.ACCEPTED : ConnectionStatus.REJECTED;
    const success = await updateConnectionStatus(id, session.user.id, newStatus);
    
    if (!success) {
      return NextResponse.json({ error: "Failed or unauthorized" }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
  }
}
