import { getDb } from "@/lib/mongodb";
import { InvestmentDiscussion } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function getDiscussionsForUser(userId: string) {
  const db = await getDb();
  
  const discussions = await db.collection("investment_discussions").find({
    $or: [
      { investorId: userId },
      { representativeId: userId }
    ]
  }).sort({ updatedAt: -1 }).toArray();

  return discussions.map(d => ({
    ...d,
    _id: d._id.toString()
  })) as InvestmentDiscussion[];
}

export async function getDiscussionById(id: string) {
  const db = await getDb();
  const discussion = await db.collection("investment_discussions").findOne({ _id: new ObjectId(id) });
  if (!discussion) return null;

  return {
    ...discussion,
    _id: discussion._id.toString()
  } as InvestmentDiscussion;
}

export async function getMessagesForDiscussion(discussionId: string) {
  const db = await getDb();
  const messages = await db.collection("investment_messages").find({
    discussionId
  }).sort({ createdAt: 1 }).toArray();

  return messages.map(m => ({
    ...m,
    _id: m._id.toString()
  }));
}
