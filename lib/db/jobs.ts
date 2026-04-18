import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Job } from "@/lib/types";

export async function createJob(data: Omit<Job, "_id" | "createdAt" | "updatedAt">): Promise<Job> {
  const db = await getDb();
  
  const jobData: Job = {
    ...data,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<Job>("jobs").insertOne(jobData);
  return { ...jobData, _id: result.insertedId.toString() };
}

export async function getJobsByCompany(companyId: string): Promise<Job[]> {
  const db = await getDb();
  return db.collection<Job>("jobs")
    .find({ companyId })
    .sort({ createdAt: -1 })
    .toArray() as Promise<Job[]>;
}

export async function getJobById(id: string): Promise<Job | null> {
  const db = await getDb();
  try {
    return db.collection("jobs").findOne({ _id: new ObjectId(id) }) as Promise<Job | null>;
  } catch {
    return null;
  }
}

export async function getAllActiveJobs(): Promise<Job[]> {
  const db = await getDb();
  return db.collection<Job>("jobs")
    .find({ isActive: true })
    .sort({ createdAt: -1 })
    .toArray() as Promise<Job[]>;
}
