import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProfileByUserId, createProfile, updateProfile, generateUniqueUsername } from "@/lib/db/profile";
import { getDb } from "@/lib/mongodb";

// GET /api/profile - get current user's profile
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

// POST /api/profile - create or update profile (onboarding step)
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const existing = await getProfileByUserId(session.user.id);

  if (existing) {
    await updateProfile(session.user.id, body);
    return NextResponse.json({ success: true });
  }

  // Create new profile
  const username = await generateUniqueUsername(
    body.username || session.user.name || session.user.email?.split("@")[0] || "user"
  );

  // Generate unique referral code for the new user
  const newReferralCode = session.user.id.substring(0, 6).toUpperCase() + Math.random().toString(36).substring(2,6).toUpperCase();

  // Handle incoming referral attribution
  let referredById = null;
  const db = await getDb();
  
  if (body.referralCode) {
    const referrerProfile = await db.collection("profiles").findOne({ referralCode: body.referralCode });
    // Prevent self-referral (though technically impossible at creation, it's a safe guard)
    if (referrerProfile && referrerProfile.userId !== session.user.id) {
      referredById = referrerProfile.userId;
      
      // Create Pending Referral Record
      await db.collection("referrals").insertOne({
        referrerId: referrerProfile.userId,
        referredUserId: session.user.id,
        status: "PENDING",
        createdAt: new Date(),
      });
    }
  }

  const profile = await createProfile({
    userId: session.user.id,
    username,
    headline: body.headline || "",
    bio: body.bio || "",
    phone: body.phone || "",
    country: body.country || "",
    avatarUrl: body.avatarUrl || session.user.image || "",
    bannerUrl: body.bannerUrl || "",
    website: body.website || "",
    onboardingComplete: body.onboardingComplete ?? false,
    education: [],
    experience: [],
    skills: [],
    referralCode: newReferralCode,
    referredBy: referredById || undefined,
    referralCount: 0,
    verifiedReferralCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json(profile);
}

// PATCH /api/profile - partial update
export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await updateProfile(session.user.id, body);
  return NextResponse.json({ success: true });
}
