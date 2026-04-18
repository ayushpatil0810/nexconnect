import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateCompany, getCompanyById } from "@/lib/db/company";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await getCompanyById(id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not the owner" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, industry, location, website, size, avatarUrl, bannerUrl } = body;

    const success = await updateCompany(id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(industry && { industry }),
      ...(location && { location }),
      ...(website !== undefined && { website }),
      ...(size && { size }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(bannerUrl !== undefined && { bannerUrl }),
    });

    if (success) {
      return NextResponse.json({ success: true, message: "Company updated successfully" });
    } else {
      return NextResponse.json({ error: "No changes made or update failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
