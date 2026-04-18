import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createConnectionRequest, getConnections } from "@/lib/db/connection";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 });
    }

    const connection = await createConnectionRequest(session.user.id, receiverId);
    return NextResponse.json(connection);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create connection request" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Return all accepted connections for the user
    const connections = await getConnections(session.user.id);
    return NextResponse.json(connections);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
  }
}
