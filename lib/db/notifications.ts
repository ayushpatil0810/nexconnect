import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Notification, NotificationType } from "@/lib/types";

export async function createNotification(data: Omit<Notification, "_id" | "read" | "createdAt">): Promise<Notification> {
  const db = await getDb();
  
  const notificationData: Notification = {
    ...data,
    read: false,
    createdAt: new Date(),
  };

  const result = await db.collection<Notification>("notifications").insertOne(notificationData);
  return { ...notificationData, _id: result.insertedId.toString() };
}

export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const db = await getDb();
  return db.collection<Notification>("notifications")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray() as Promise<Notification[]>;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const db = await getDb();
  return db.collection<Notification>("notifications").countDocuments({ userId, read: false });
}

export async function markNotificationAsRead(id: string, userId: string): Promise<boolean> {
  const db = await getDb();
  try {
    const result = await db.collection("notifications").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { read: true } }
    );
    return result.modifiedCount > 0;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("notifications").updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );
  return result.modifiedCount > 0;
}
