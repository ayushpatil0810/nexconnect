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

export async function getCompaniesByRepresentative(userId: string): Promise<Company[]> {
  const db = await getDb();
  return db.collection<Company>("companies").find({
    $or: [
      { creatorId: userId },
      { "authorizedRepresentatives.userId": userId }
    ]
  }).toArray() as Promise<Company[]>;
}

export function calculateCompanyTrustScore(company: Partial<Company>): number {
  let score = 0;
  
  if (company.hasVerifiedOwner) score += 40;
  
  // Assume STRONG verification level implies domain verified / official documentation
  if (company.verificationLevel === "STRONG" || company.verificationStatus === "VERIFIED") score += 20;
  
  // Base activity (if it has website, description, logo)
  if (company.website && company.description && company.avatarUrl) score += 20;

  // Assuming negative reports would decrement it, but this acts as the base recalculation
  return Math.min(100, Math.max(0, score));
}
