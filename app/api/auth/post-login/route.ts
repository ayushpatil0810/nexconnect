import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

/**
 * GET /api/auth/post-login
 *
 * Called as the OAuth callbackURL after a successful sign-in.
 * Checks whether the user has completed onboarding and redirects them
 * to the appropriate destination:
 *   - /onboarding  → first-time users who haven't set up their profile
 *   - /feed        → returning users who already completed onboarding
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/sign-in", baseUrl));
    }

    const db = await getDb();
    const profile = await db
      .collection("profiles")
      .findOne(
        { userId: session.user.id },
        { projection: { onboardingComplete: 1 } }
      );

    const onboardingComplete = !!profile?.onboardingComplete;

    return NextResponse.redirect(
      new URL(onboardingComplete ? "/feed" : "/onboarding", baseUrl)
    );
  } catch {
    // On any error, fall back to sign-in to avoid loops
    return NextResponse.redirect(new URL("/auth/sign-in", baseUrl));
  }
}
