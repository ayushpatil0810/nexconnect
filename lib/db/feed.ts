import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Post, Comment, Reaction } from "@/lib/types";

// POSTS
export async function createPost(data: Omit<Post, "_id" | "createdAt" | "updatedAt">): Promise<Post> {
  const db = await getDb();
  const postData: Post = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const { _id, ...insertData } = postData;
  const result = await db.collection("posts").insertOne(insertData);
  return { ...postData, _id: result.insertedId.toString() };
}

export async function getPosts(limit = 20, skip = 0): Promise<Post[]> {
  const db = await getDb();
  const posts = await db.collection("posts").find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
  return posts.map(p => ({ ...p, _id: p._id.toString() })) as unknown as Promise<Post[]>;
}

export async function getPostById(id: string): Promise<Post | null> {
  const db = await getDb();
  try {
    const post = await db.collection("posts").findOne({ _id: new ObjectId(id) });
    return post ? ({ ...post, _id: post._id.toString() } as unknown as Post) : null;
  } catch {
    return null;
  }
}

export async function deletePost(id: string, authorId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("posts").deleteOne({ _id: new ObjectId(id), authorId });
  
  if (result.deletedCount > 0) {
    // cascade delete comments and reactions
    await db.collection("comments").deleteMany({ postId: id });
    await db.collection("reactions").deleteMany({ postId: id });
    return true;
  }
  return false;
}

// COMMENTS
export async function addComment(data: Omit<Comment, "_id" | "createdAt" | "updatedAt">): Promise<Comment> {
  const db = await getDb();
  const commentData: Comment = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const { _id, ...insertData } = commentData;
  const result = await db.collection("comments").insertOne(insertData);
  return { ...commentData, _id: result.insertedId.toString() };
}

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const db = await getDb();
  const comments = await db.collection("comments").find({ postId }).sort({ createdAt: 1 }).toArray();
  return comments.map(c => ({ ...c, _id: c._id.toString() })) as unknown as Promise<Comment[]>;
}

export async function deleteComment(id: string, authorId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("comments").deleteOne({ _id: new ObjectId(id), authorId });
  return result.deletedCount > 0;
}

// REACTIONS
export async function toggleReaction(postId: string, authorId: string, type: Reaction["type"]): Promise<boolean> {
  const db = await getDb();
  
  const existing = await db.collection("reactions").findOne({ postId, authorId });
  if (existing) {
    if (existing.type === type) {
      // remove reaction
      await db.collection("reactions").deleteOne({ _id: existing._id });
      return false; // represents un-liked
    } else {
      // change reaction type
      await db.collection("reactions").updateOne({ _id: existing._id }, { $set: { type } });
      return true; // represents liked/reacted
    }
  } else {
    // new reaction
    const reactionData: Reaction = { postId, authorId, type, createdAt: new Date() };
    const { _id, ...insertData } = reactionData;
    await db.collection("reactions").insertOne(insertData);
    return true;
  }
}

export async function getReactionsByPostId(postId: string): Promise<Reaction[]> {
  const db = await getDb();
  const reactions = await db.collection("reactions").find({ postId }).toArray();
  return reactions.map(r => ({ ...r, _id: r._id.toString() })) as unknown as Promise<Reaction[]>;
}
