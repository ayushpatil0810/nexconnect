import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addComment, getCommentsByPostId, getPostById } from "@/lib/db/feed";
import { getUserWithProfile } from "@/lib/db/profile";
import { createNotification } from "@/lib/db/notifications";
import { NotificationType } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comments = await getCommentsByPostId(id);

    // Hydrate comments with author details
    const hydratedComments = await Promise.all(
      comments.map(async (c) => {
        const profile = await getUserWithProfile(c.authorId);
        return { ...c, author: profile };
      })
    );

    return NextResponse.json(hydratedComments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

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
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const comment = await addComment({
      postId: id,
      authorId: session.user.id,
      content,
    });

    const profile = await getUserWithProfile(session.user.id);

    // Notification logic
    const post = await getPostById(id);
    if (post && post.authorId !== session.user.id) {
      const actorName = profile?.profile?.username || session.user.name;
      await createNotification({
        userId: post.authorId,
        type: NotificationType.COMMENT,
        content: `${actorName} commented on your post: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
        link: `/feed`,
        actorId: session.user.id
      });
    }

    return NextResponse.json({ ...comment, author: profile });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
