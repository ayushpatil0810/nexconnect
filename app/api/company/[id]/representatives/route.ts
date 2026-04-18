import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await getCompanyById(id);
    if (!company || company.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = await getDb();
    
    // Check if user exists
    const user = await db.collection("user").findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: "User ID does not exist on the platform" }, { status: 400 });
    }

    // Add representative mapping to company
    await db.collection("companies").updateOne(
      { _id: new ObjectId(id) },
      { 
        $addToSet: { 
          authorizedRepresentatives: { userId, role } 
        } 
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add representative:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
