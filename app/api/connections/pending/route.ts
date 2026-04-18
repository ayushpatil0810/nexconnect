import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ConnectionStatus } from "@/lib/types";
import { getUserWithProfile } from "@/lib/db/profile";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const pendingConnections = await db.collection("connections").find({
      receiverId: session.user.id,
      status: ConnectionStatus.PENDING
    }).toArray();

    const hydratedInvitations = await Promise.all(
      pendingConnections.map(async (conn) => {
        const requester = await getUserWithProfile(conn.requesterId);
        return { ...conn, _id: conn._id.toString(), requester };
      })
    );

    return NextResponse.json(hydratedInvitations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pending connections" }, { status: 500 });
  }
}
