import { getDb } from "@/lib/mongodb";
import { BusinessOpportunity, OpportunityResponse } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function createOpportunity(opportunity: Omit<BusinessOpportunity, "_id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  
  const newOpportunity: Omit<BusinessOpportunity, "_id"> = {
    ...opportunity,
    status: "OPEN",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("business_opportunities").insertOne(newOpportunity);
  return { ...newOpportunity, _id: result.insertedId.toString() };
}

export async function getOpportunitiesByCompany(companyId: string) {
  const db = await getDb();
  const opportunities = await db.collection("business_opportunities").find({ companyId }).sort({ createdAt: -1 }).toArray();
  
  return opportunities.map(o => ({
    ...o,
    _id: o._id.toString()
  })) as BusinessOpportunity[];
}

export async function getAllOpenOpportunities() {
  const db = await getDb();
  const opportunities = await db.collection("business_opportunities").find({ status: "OPEN" }).sort({ createdAt: -1 }).toArray();
  
  return opportunities.map(o => ({
    ...o,
    _id: o._id.toString()
  })) as BusinessOpportunity[];
}

export async function getOpportunityById(id: string) {
  const db = await getDb();
  const opportunity = await db.collection("business_opportunities").findOne({ _id: new ObjectId(id) });
  if (!opportunity) return null;

  return {
    ...opportunity,
    _id: opportunity._id.toString()
  } as BusinessOpportunity;
}

export async function createOpportunityResponse(response: Omit<OpportunityResponse, "_id" | "createdAt">) {
  const db = await getDb();
  
  const newResponse: Omit<OpportunityResponse, "_id"> = {
    ...response,
    status: "PENDING",
    createdAt: new Date()
  };

  const result = await db.collection("opportunity_responses").insertOne(newResponse);
  return { ...newResponse, _id: result.insertedId.toString() };
}

export async function getOpportunityResponsesForCompany(companyId: string) {
  const db = await getDb();
  // Find all opportunities owned by this company
  const ops = await db.collection("business_opportunities").find({ companyId }).toArray();
  const opIds = ops.map(op => op._id.toString());
  
  // Find all responses for these opportunities
  const responses = await db.collection("opportunity_responses").find({
    opportunityId: { $in: opIds }
  }).sort({ createdAt: -1 }).toArray();

  return responses.map(r => ({
    ...r,
    _id: r._id.toString()
  })) as OpportunityResponse[];
}

export async function getOpportunityResponsesForUser(userId: string) {
  const db = await getDb();
  const responses = await db.collection("opportunity_responses").find({
    responderUserId: userId
  }).sort({ createdAt: -1 }).toArray();

  return responses.map(r => ({
    ...r,
    _id: r._id.toString()
  })) as OpportunityResponse[];
}
