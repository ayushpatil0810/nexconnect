import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Company } from "@/lib/types";

export async function createCompany(data: Omit<Company, "_id" | "createdAt" | "updatedAt">): Promise<Company> {
  const db = await getDb();
  
  const companyData: Company = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<Company>("companies").insertOne(companyData);
  return { ...companyData, _id: result.insertedId.toString() };
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const db = await getDb();
  try {
    return db.collection("companies").findOne({ _id: new ObjectId(id) }) as Promise<Company | null>;
  } catch {
    return null;
  }
}

export async function updateCompany(id: string, data: Partial<Company>): Promise<boolean> {
  const db = await getDb();
  try {
    const result = await db.collection("companies").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  } catch {
    return false;
  }
}

export async function getCompaniesByCreator(creatorId: string): Promise<Company[]> {
    const db = await getDb();
    return db.collection<Company>("companies").find({ creatorId }).toArray() as Promise<Company[]>;
}
