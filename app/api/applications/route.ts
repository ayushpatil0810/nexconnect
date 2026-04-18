import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getJobById } from "@/lib/db/jobs";
import { createApplication, hasUserApplied } from "@/lib/db/applications";
import { getCompanyById } from "@/lib/db/company";
import { getProfileByUserId } from "@/lib/db/profile";
import { generateMatchAnalysis } from "@/lib/matching";
import { createNotification } from "@/lib/db/notifications";
import { NotificationType } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, coverLetter } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const alreadyApplied = await hasUserApplied(session.user.id, jobId);
    if (alreadyApplied) {
      return NextResponse.json({ error: "You have already applied for this job" }, { status: 400 });
    }

    // Auto-fetch profile for match score
    const profile = await getProfileByUserId(session.user.id);
    const matchAnalysis = generateMatchAnalysis(profile, job);

    const newApplication = await createApplication({
      jobId,
      userId: session.user.id,
      companyId: job.companyId,
      coverLetter,
      matchScore: matchAnalysis.score
    });

    // Notify company owner
    const company = await getCompanyById(job.companyId);
    if (company) {
      const applicantName = profile?.profile?.username || session.user.name;
      await createNotification({
        userId: company.creatorId,
        type: NotificationType.APPLICATION_UPDATE,
        content: `${applicantName} applied for your ${job.title} position!`,
        link: `/company/${company._id}/recruitment`,
        actorId: session.user.id
      });
    }

    return NextResponse.json({ success: true, application: newApplication }, { status: 201 });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
