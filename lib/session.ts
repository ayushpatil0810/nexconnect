import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getProfileByUserId } from "@/lib/db/profile";

export async function getSessionFromRequest(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) return null;

    const profile = await getProfileByUserId(session.user.id);
    const needsOnboarding = !profile || !profile.onboardingComplete;

    return { ...session, needsOnboarding };
  } catch {
    return null;
  }
}
