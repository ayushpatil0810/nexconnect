import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPost, getPosts, getReactionsByPostId, getCommentsByPostId, getPostById } from "@/lib/db/feed";
import { getUserWithProfile } from "@/lib/db/profile";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, mediaUrl, isRepost, originalPostId } = body;

    // Content is optional for a direct repost without commentary
    if (!content && !isRepost) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const post = await createPost({
      authorId: session.user.id,
      content: content || "",
      mediaUrl: mediaUrl || "",
      isRepost: !!isRepost,
      originalPostId: originalPostId || undefined,
    });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = parseInt(url.searchParams.get("skip") || "0");

    const posts = await getPosts(limit, skip);

    // Hydrate posts with author details, reactions, and comments count
    const hydratedPosts = await Promise.all(
      posts.map(async (post) => {
        const [profile, reactions, comments] = await Promise.all([
          getUserWithProfile(post.authorId),
          getReactionsByPostId(post._id!),
          getCommentsByPostId(post._id!),
        ]);

        let originalPost = null;
        if (post.isRepost && post.originalPostId) {
          const rawOriginal = await getPostById(post.originalPostId);
          if (rawOriginal) {
            const originalAuthor = await getUserWithProfile(rawOriginal.authorId);
            originalPost = {
              ...rawOriginal,
              author: originalAuthor
            };
          }
        }

        return {
          ...post,
          author: profile,
          reactions,
          originalPost,
          commentsCount: comments.length,
          userReacted: reactions.some(r => r.authorId === session.user.id)
        };
      })
    );

    return NextResponse.json(hydratedPosts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
