import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { createOpportunity } from "@/lib/db/opportunities";
import { OpportunityType } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, title, description, type, budget, requirements } = body;

    if (!companyId || !title || !description || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const company = await getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify user is an authorized representative of the company
    let reps = company.authorizedRepresentatives || [];
    if (!reps.find(r => r.userId === company.creatorId)) {
      reps.unshift({ userId: company.creatorId, role: "Owner" });
    }

    const userRole = reps.find(r => r.userId === session.user.id)?.role;
    if (!userRole || (userRole !== "Owner" && userRole !== "Admin")) {
      return NextResponse.json({ error: "Only Owners and Admins can post opportunities" }, { status: 403 });
    }

    if (company.verificationLevel !== "STRONG") {
      return NextResponse.json({ error: "Organization must be strongly verified to use the Marketplace" }, { status: 403 });
    }

    const opportunity = await createOpportunity({
      companyId,
      title,
      description,
      type: type as OpportunityType,
      budget,
      requirements: requirements || [],
      status: "OPEN"
    });

    return NextResponse.json({ success: true, opportunity });
  } catch (error) {
    console.error("Failed to create opportunity:", error);
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
  }
}
