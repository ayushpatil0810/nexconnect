import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Profile } from "@/lib/types";

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const db = await getDb();
  return db.collection<Profile>("profiles").findOne({ userId }) as Promise<Profile | null>;
}

export async function getUserWithProfile(userId: string): Promise<any | null> {
  const db = await getDb();
  let userObjectId;
  try {
    userObjectId = new ObjectId(userId);
  } catch {
    return null; // Invalid ObjectId
  }

  const [profile, user] = await Promise.all([
    db.collection<Profile>("profiles").findOne({ userId }),
    db.collection("user").findOne({ _id: userObjectId })
  ]);
  
  if (!user && !profile) return null;
  
  return {
    ...profile,
    name: user?.name,
    email: user?.email,
    avatarUrl: profile?.avatarUrl || user?.image
  };
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const db = await getDb();
  return db.collection<Profile>("profiles").findOne({ username }) as Promise<Profile | null>;
}

export async function createProfile(data: Omit<Profile, "_id">): Promise<Profile> {
  const db = await getDb();
  const result = await db.collection<Profile>("profiles").insertOne(data as Profile);
  return { ...data, _id: result.insertedId.toString() };
}

export async function updateProfile(userId: string, data: Partial<Profile>): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<Profile>("profiles").updateOne(
    { userId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function generateUniqueUsername(name: string): Promise<string> {
  const db = await getDb();
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  let username = base;
  let counter = 1;

  while (await db.collection("profiles").findOne({ username })) {
    username = `${base}${counter}`;
    counter++;
  }

  return username;
}
