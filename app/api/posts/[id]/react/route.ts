import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleReaction, getPostById } from "@/lib/db/feed";
import { createNotification } from "@/lib/db/notifications";
import { NotificationType } from "@/lib/types";
import { getUserWithProfile } from "@/lib/db/profile";

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
    const body = await request.json();
    const type = body.type || "LIKE";

    const isReacted = await toggleReaction(id, session.user.id, type);

    // If successfully reacted (not un-reacted) and the post exists
    if (isReacted) {
      const post = await getPostById(id);
      // Only notify if the liker is not the author
      if (post && post.authorId !== session.user.id) {
        const actorProfile = await getUserWithProfile(session.user.id);
        const actorName = actorProfile?.profile?.username || session.user.name;
        
        await createNotification({
          userId: post.authorId,
          type: NotificationType.LIKE,
          content: `${actorName} liked your post.`,
          link: `/feed`, // ideally link to specific post if there's a post detail page
          actorId: session.user.id
        });
      }
    }

    return NextResponse.json({ success: true, isReacted });
  } catch (error) {
    return NextResponse.json({ error: "Failed to react" }, { status: 500 });
  }
}
