import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCompany } from "@/lib/db/company";
import { VerificationLevel } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, website, industry, location, size, creatorRole } = body;

    if (!name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const company = await createCompany({
      name,
      website: website || "",
      industry: industry || "",
      location: location || "",
      size: size || "",
      creatorId: session.user.id,
      creatorRole: creatorRole || "Employee",
      verificationLevel: VerificationLevel.UNVERIFIED,
      trustScore: 0,
    });

    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}
