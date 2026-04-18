import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const DISPOSABLE_OR_GENERIC_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", 
  "aol.com", "icloud.com", "mailinator.com", "10minutemail.com"
];

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const domain = email.split("@")[1].toLowerCase();
    
    if (DISPOSABLE_OR_GENERIC_DOMAINS.includes(domain)) {
      return NextResponse.json({ 
        error: "Please use a corporate/work email. Generic or disposable domains are not allowed." 
      }, { status: 400 });
    }

    const db = await getDb();
    
    // Check if email is already verified by someone
    const existing = await db.collection("verifications").findOne({ 
      type: "WORK_EMAIL", 
      "metadata.email": email,
      status: "APPROVED" 
    });

    if (existing) {
      return NextResponse.json({ error: "This work email is already verified by another account." }, { status: 400 });
    }

    // Generate secure magic link token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.collection("magic_links").insertOne({
      userId: session.user.id,
      email,
      domain,
      token,
      expiresAt,
      type: "WORK_EMAIL",
      createdAt: new Date()
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicLink = `${baseUrl}/verify/work-email?token=${token}`;

    // Send the email using Nodemailer
    await sendVerificationEmail(email, magicLink);

    return NextResponse.json({ 
      success: true, 
      message: "Verification link sent successfully. Please check your inbox."
    });

  } catch (error) {
    console.error("Work email request error:", error);
    return NextResponse.json({ error: "Failed to request verification" }, { status: 500 });
  }
}
