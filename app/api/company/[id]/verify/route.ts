import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompanyById, updateCompany } from "@/lib/db/company";
import { VerificationLevel } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const company = await getCompanyById(id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden. Only creator can verify." }, { status: 403 });
    }

    const body = await request.json();
    const { method, email, documentUrl } = body;

    let newLevel = company.verificationLevel;
    let newScore = company.trustScore;

    if (method === "email" && email) {
      // Basic domain check logic (mock)
      const emailDomain = email.split("@")[1]?.toLowerCase();
      let companyDomain = "";
      
      try {
          if (company.website) {
            const url = new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`);
            companyDomain = url.hostname.replace(/^www\./, '').toLowerCase();
          }
      } catch (e) {
          // ignore parsing error
      }

      if (companyDomain && emailDomain === companyDomain) {
        newLevel = VerificationLevel.STRONG;
        newScore = 90;
      } else {
         return NextResponse.json({ error: "Email domain does not match company website." }, { status: 400 });
      }
    } else if (method === "document" && documentUrl) {
      // Mock document upload verification
      newLevel = VerificationLevel.WEAK;
      newScore = Math.max(newScore, 40); // don't downgrade if already strong
    } else {
        return NextResponse.json({ error: "Invalid verification method." }, { status: 400 });
    }

    await updateCompany(id, {
      verificationLevel: newLevel,
      trustScore: newScore,
    });

    return NextResponse.json({ success: true, verificationLevel: newLevel, trustScore: newScore });
  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
