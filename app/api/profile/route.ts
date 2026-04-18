import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProfileByUserId, createProfile, updateProfile, generateUniqueUsername } from "@/lib/db/profile";

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
