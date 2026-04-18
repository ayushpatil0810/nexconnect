import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { addVerificationRecord } from "@/lib/db/trust";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const db = await getDb();
    
    // Find valid token
    const magicLink = await db.collection("magic_links").findOne({
      token,
      type: "WORK_EMAIL",
      expiresAt: { $gt: new Date() } // Must not be expired
    });

    if (!magicLink) {
      return NextResponse.json({ error: "Invalid or expired verification link." }, { status: 400 });
    }

    // Ensure the token belongs to the logged in user (prevents cross-session hijacking)
    if (magicLink.userId !== session.user.id) {
      return NextResponse.json({ error: "This link belongs to a different account." }, { status: 403 });
    }

    // Create the verification record
    await addVerificationRecord(
      session.user.id,
      "WORK_EMAIL",
      "APPROVED",
      { email: magicLink.email, domain: magicLink.domain }
    );

    // Delete the used token
    await db.collection("magic_links").deleteOne({ _id: magicLink._id });

    return NextResponse.json({ success: true, message: "Work email verified successfully!" });

  } catch (error) {
    console.error("Work email confirmation error:", error);
    return NextResponse.json({ error: "Failed to confirm verification" }, { status: 500 });
  }
}
