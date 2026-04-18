import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addVerificationRecord } from "@/lib/db/trust";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type } = body;

    // In a real application, this would trigger an actual verification process.
    // For this prototype, we immediately approve the mock request to demonstrate the scoring.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validate type
    if (!["WORK_EMAIL", "GOV_ID", "LINKEDIN"].includes(type)) {
      return NextResponse.json({ error: "Invalid verification type" }, { status: 400 });
    }

    // Add record
    await addVerificationRecord(
      session.user.id,
      type as any,
      "APPROVED",
      { source: "mock_simulation" }
    );

    return NextResponse.json({ success: true, message: `${type} verified successfully.` });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Failed to process verification" }, { status: 500 });
  }
}
