import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient } from "mongodb";

// ── Route classification ───────────────────────────────────────────────────

/** Always accessible without authentication */
const PUBLIC_PATHS = new Set([
  "/",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/verify-email",
]);

/** Prefixes that are always allowed through (APIs, assets, etc.) */
const PUBLIC_PREFIXES = [
  "/api/auth",      // Better Auth internal endpoints
  "/api/verify",    // Verification endpoints (called from email links)
  "/_next",         // Next.js build assets
  "/favicon",
];

/** Auth pages — redirect away if the user is already logged in */
const AUTH_ONLY_ROUTES = new Set(["/auth/sign-in", "/auth/sign-up"]);

// ── CORS helpers (API routes only) ───────────────────────────────────────────

const DEFAULT_CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const DEFAULT_CORS_HEADERS = "Content-Type, Authorization";

function getAllowedOrigins(): string[] {
  const configured = process.env.CORS_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  const defaults = [process.env.NEXT_PUBLIC_APP_URL, process.env.BETTER_AUTH_URL]
    .filter((origin): origin is string => Boolean(origin))
    .map((origin) => origin.trim());

  return [...new Set([...configured, ...defaults])];
}

function resolveAllowedOrigin(request: NextRequest): string | null {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) return null;

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes("*")) return "*";
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : null;
}

function applyCorsHeaders(response: NextResponse, request: NextRequest) {
  const allowedOrigin = resolveAllowedOrigin(request);
  if (!allowedOrigin) return response;

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Methods", DEFAULT_CORS_METHODS);
  response.headers.set(
    "Access-Control-Allow-Headers",
    request.headers.get("access-control-request-headers") || DEFAULT_CORS_HEADERS
  );
  response.headers.set("Vary", "Origin");

  if (allowedOrigin !== "*") {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

// ── MongoDB helper (proxy-local, lightweight) ──────────────────────────────

let _client: MongoClient | null = null;

async function getOnboardingStatus(userId: string): Promise<boolean> {
  if (!_client) {
    _client = new MongoClient(process.env.DATABASE_URL!);
    await _client.connect();
  }
  const db = _client.db();
  const profile = await db
    .collection("profiles")
    .findOne({ userId }, { projection: { onboardingComplete: 1 } });
  return !!profile?.onboardingComplete;
}

// ── Proxy function ─────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  if (isApiRoute && request.method === "OPTIONS") {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), request);
  }

  // 1. Always allow: Next.js internals, auth APIs, verification endpoints
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next();
    return isApiRoute ? applyCorsHeaders(response, request) : response;
  }

  // 2. Always allow: public profile pages (e.g. /profile/username)
  if (/^\/profile\/[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // 3. Fully public pages — no session needed
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // 4. Read session via Better Auth (Node.js runtime — fully supported)
  let userId: string | null = null;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    userId = session?.user?.id ?? null;
  } catch {
    // Session read failed — treat as unauthenticated
  }

  // 5. Unauthenticated: redirect to sign-in, preserving destination
  if (!userId) {
    const signIn = new URL("/auth/sign-in", request.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  // 6. Authenticated user hitting a login/signup page → send to feed
  if (AUTH_ONLY_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  const isOnboardingPage = pathname === "/onboarding";

  // 7. Check onboarding status from DB (only for page navigations, not API calls)
  try {
    const onboardingComplete = await getOnboardingStatus(userId);

    // Not yet onboarded → force to /onboarding (unless already there or it's an API route)
    if (!onboardingComplete && !isOnboardingPage && !isApiRoute) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Already onboarded → don't show /onboarding again, send to /feed
    if (onboardingComplete && isOnboardingPage) {
      return NextResponse.redirect(new URL("/feed", request.url));
    }
  } catch {
    // DB unreachable — allow through to avoid locking everyone out
  }

  const response = NextResponse.next();
  return isApiRoute ? applyCorsHeaders(response, request) : response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (build output)
     * - _next/image   (image optimizer)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
