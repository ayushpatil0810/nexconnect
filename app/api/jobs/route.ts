import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { createJob } from "@/lib/db/jobs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      companyId, title, description, requirements, experienceLevel, 
      employmentType, locationType, location, salaryMin, salaryMax, targetPersona 
    } = body;

    if (!companyId || !title || !description || !requirements || requirements.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership
    const company = await getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: You are not the owner of this company" }, { status: 403 });
    }

    const newJob = await createJob({
      companyId,
      title,
      description,
      requirements,
      experienceLevel,
      employmentType,
      locationType,
      location,
      salaryMin,
      salaryMax,
      targetPersona,
      isActive: true
    });

    return NextResponse.json({ success: true, job: newJob }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
