import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Application, ApplicationStatus } from "@/lib/types";

export async function createApplication(data: Omit<Application, "_id" | "createdAt" | "updatedAt" | "status">): Promise<Application> {
  const db = await getDb();
  
  const applicationData: Application = {
    ...data,
    status: ApplicationStatus.APPLIED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<Application>("applications").insertOne(applicationData);
  return { ...applicationData, _id: result.insertedId.toString() };
}

export async function getApplicationsByUser(userId: string): Promise<Application[]> {
  const db = await getDb();
  return db.collection<Application>("applications")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray() as Promise<Application[]>;
}

export async function getApplicationsByJob(jobId: string): Promise<Application[]> {
  const db = await getDb();
  return db.collection<Application>("applications")
    .find({ jobId })
    .sort({ createdAt: -1 })
    .toArray() as Promise<Application[]>;
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<boolean> {
  const db = await getDb();
  try {
    const result = await db.collection("applications").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch {
    return false;
  }
}

export async function hasUserApplied(userId: string, jobId: string): Promise<boolean> {
  const db = await getDb();
  const count = await db.collection("applications").countDocuments({ userId, jobId });
  return count > 0;
}

export async function getUserApplicationForJob(userId: string, jobId: string): Promise<Application | null> {
  const db = await getDb();
  return db.collection<Application>("applications").findOne({ userId, jobId }) as Promise<Application | null>;
}
