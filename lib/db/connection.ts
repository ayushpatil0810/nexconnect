import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Connection, ConnectionStatus, Profile } from "@/lib/types";

export async function createConnectionRequest(requesterId: string, receiverId: string): Promise<Connection> {
  const db = await getDb();
  const connectionData: Connection = {
    requesterId,
    receiverId,
    status: ConnectionStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const { _id, ...insertData } = connectionData;
  const result = await db.collection("connections").insertOne(insertData);
  return { ...connectionData, _id: result.insertedId.toString() };
}

export async function updateConnectionStatus(id: string, receiverId: string, status: ConnectionStatus): Promise<boolean> {
  const db = await getDb();
  try {
    const result = await db.collection("connections").updateOne(
      { _id: new ObjectId(id), receiverId },
      { $set: { status, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch {
    return false;
  }
}

export async function getConnections(userId: string): Promise<Connection[]> {
  const db = await getDb();
  return db.collection("connections").find({
    $or: [{ requesterId: userId }, { receiverId: userId }],
    status: ConnectionStatus.ACCEPTED
  }).toArray() as unknown as Promise<Connection[]>;
}

// Recommended connections: people not connected to the user, not including the user
export async function getRecommendations(userId: string, limit = 5): Promise<Profile[]> {
  const db = await getDb();
  
  // get existing connection IDs to exclude
  const existingConnections = await db.collection("connections").find({
    $or: [{ requesterId: userId }, { receiverId: userId }]
  }).toArray();
  
  const excludeIds = existingConnections.flatMap(c => [c.requesterId, c.receiverId]);
  excludeIds.push(userId); // exclude self
  
  const uniqueExcludeIds = Array.from(new Set(excludeIds));

  // find profiles not in excludeIds
  return db.collection("profiles").find({
    userId: { $nin: uniqueExcludeIds }
  }).limit(limit).toArray() as unknown as Promise<Profile[]>;
}
