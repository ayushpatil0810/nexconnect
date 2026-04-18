import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { VerificationRecord, Profile } from "@/lib/types";

// Named Entity Risk Detection (NERD) Watchlist
const NERD_WATCHLIST = [
  "elon musk", "mark zuckerberg", "sundar pichai", "satya nadella", "sam altman", "tim cook"
];

const RESTRICTED_TITLES = ["ceo", "founder", "cto", "president", "owner"];

export async function calculateTrustScore(userId: string): Promise<void> {
  const db = await getDb();
  
  // Fetch user profile and user base model
  const profile = await db.collection<Profile>("profiles").findOne({ userId });
  let userObjectId;
  try {
    userObjectId = new ObjectId(userId);
  } catch { return; }
  
  const user = await db.collection("user").findOne({ _id: userObjectId });
  if (!profile || !user) return;
  
  const verifications = await db.collection<VerificationRecord>("verifications").find({ userId }).toArray();
  
  // Initialize Scores
  let identityConfidence = 0;
  let trustScore = 0;
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let verificationStatus: "PENDING" | "VERIFIED" | "RESTRICTED" = "PENDING";
  
  // 1. Evaluate Verifications
  const hasMagicLink = user.emailVerified;
  const hasWorkEmail = verifications.some(v => v.type === "WORK_EMAIL" && v.status === "APPROVED");
  const hasLinkedIn = verifications.some(v => v.type === "LINKEDIN" && v.status === "APPROVED");
  const hasGovId = verifications.some(v => v.type === "GOV_ID" && v.status === "APPROVED");
  
  if (hasMagicLink) {
    identityConfidence += 20;
    trustScore += 10;
  }
  if (hasWorkEmail) {
    identityConfidence += 30;
    trustScore += 20;
  }
  if (hasLinkedIn) {
    identityConfidence += 10;
    trustScore += 15;
  }
  if (hasGovId) {
    identityConfidence += 40;
    trustScore += 40;
  }
  
  // 2. Named Entity Risk Detection (NERD)
  const normalizedName = (user.name || "").toLowerCase().trim();
  if (NERD_WATCHLIST.includes(normalizedName)) {
    riskLevel = "HIGH";
    if (!hasGovId) {
      trustScore -= 50; // Hard penalty until Gov ID is provided
    }
  }
  
  // 3. Suspicious Claim Heuristics
  const headline = (profile.headline || "").toLowerCase();
  const claimsExecutive = RESTRICTED_TITLES.some(title => headline.includes(title));
  
  if (claimsExecutive && !hasWorkEmail && !hasGovId) {
    riskLevel = "HIGH";
    trustScore -= 30; // Cannot claim CEO without strong verification
  }
  
  // 4. Time-based & Base metrics
  const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (accountAgeDays > 30) {
    trustScore += 5; // Small bump for seasoned accounts
  }
  
  // Cap scores
  identityConfidence = Math.max(0, Math.min(100, identityConfidence));
  trustScore = Math.max(0, Math.min(100, trustScore));
  
  // 5. Determine Final Status
  let reviewRequired = false;
  if (trustScore >= 70) {
    verificationStatus = "VERIFIED";
  } else if (trustScore >= 50) {
    verificationStatus = "PENDING"; 
  } else {
    verificationStatus = "RESTRICTED";
    reviewRequired = true; // Flag for manual review if they get restricted
  }
  
  // If High Risk, auto-restrict unless they have Gov ID
  if (riskLevel === "HIGH" && !hasGovId) {
    verificationStatus = "RESTRICTED";
    reviewRequired = true;
  }
  
  // Get work email string if available
  const workEmailVerif = verifications.find(v => v.type === "WORK_EMAIL" && v.status === "APPROVED");
  const workEmail = workEmailVerif?.metadata?.email;
  
  // Update Profile
  await db.collection("profiles").updateOne(
    { userId },
    { 
      $set: { 
        identityConfidence,
        trustScore,
        riskLevel,
        verificationStatus,
        reviewRequired,
        hasWorkEmail,
        hasGovId,
        hasLinkedIn,
        ...(workEmail ? { workEmail } : {}),
        updatedAt: new Date()
      } 
    }
  );
}

// Create a new verification record
export async function addVerificationRecord(
  userId: string, 
  type: VerificationRecord["type"], 
  status: VerificationRecord["status"], 
  metadata?: any
) {
  const db = await getDb();
  await db.collection<VerificationRecord>("verifications").insertOne({
    userId,
    type,
    status,
    metadata,
    createdAt: new Date()
  });
  
  // Recalculate trust score asynchronously
  await calculateTrustScore(userId);
}
