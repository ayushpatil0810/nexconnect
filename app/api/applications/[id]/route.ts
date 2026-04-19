import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateApplicationStatus } from "@/lib/db/applications";
import { getCompanyById } from "@/lib/db/company";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createNotification } from "@/lib/db/notifications";
import { NotificationType, Application } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, companyId } = body;

    if (!status || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify company ownership
    const company = await getCompanyById(companyId);
    if (!company || company.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not the company owner" }, { status: 403 });
    }

    const success = await updateApplicationStatus(id, status);
    
    if (success) {
      // Get the application to know the user and job details
      const db = await getDb();
      const app = await db.collection("applications").findOne({ _id: new ObjectId(id) }) as Application | null;
      
      if (app) {
        let statusText = status.toLowerCase().replace("_", " ");
        if (status === 'HIRED') statusText = 'marked as HIRED! 🎉';
        if (status === 'REJECTED') statusText = 'not selected';
        if (status === 'SHORTLISTED') statusText = 'shortlisted! 🌟';
        
        await createNotification({
          userId: app.userId,
          type: NotificationType.APPLICATION_UPDATE,
          content: `Your application status at ${company.name} was updated to ${statusText}.`,
          link: "/jobs/applications",
          actorId: session.user.id
        });
      }

      return NextResponse.json({ success: true, message: "Status updated" });
    } else {
      return NextResponse.json({ error: "Failed to update status" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
