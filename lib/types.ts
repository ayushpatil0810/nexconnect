export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Profile {
  _id?: string;
  userId: string;
  username: string;
  headline: string;
  bio: string;
  phone: string;
  country: string;
  avatarUrl: string;
  bannerUrl: string;
  website: string;
  onboardingComplete: boolean;
  education: Education[];
  experience: Experience[];
  skills: string[];
  
  // Identity & Trust System
  verificationStatus?: "PENDING" | "VERIFIED" | "RESTRICTED";
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  trustScore?: number; // 0 to 100
  identityConfidence?: number; // 0 to 100
  reviewRequired?: boolean;
  
  // Verification Details
  workEmail?: string;
  hasWorkEmail?: boolean;
  hasGovId?: boolean;
  hasLinkedIn?: boolean;

  // Growth & Referrals
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
  verifiedReferralCount?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  _id?: string;
  referrerId: string;
  referredUserId: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: Date;
}

export interface Reward {
  _id?: string;
  userId: string;
  milestone: number;
  rewardType: string;
  status: "LOCKED" | "UNLOCKED" | "CLAIMED";
  createdAt: Date;
}

export enum VerificationLevel {
  UNVERIFIED = "UNVERIFIED",
  WEAK = "WEAK",         // e.g., document upload
  STRONG = "STRONG",     // e.g., domain email match
}

export interface VerificationRecord {
  _id?: string;
  userId: string;
  type: "EMAIL" | "WORK_EMAIL" | "LINKEDIN" | "GOV_ID" | "COMPANY_REGISTRATION";
  status: "APPROVED" | "REJECTED";
  metadata?: {
    domain?: string;
    idFingerprint?: string;
    [key: string]: any;
  };
  createdAt: Date;
}

export interface Company {
  _id?: string;
  name: string;
  description?: string;
  website?: string;
  industry: string;
  location: string;
  size: string;
  avatarUrl?: string;
  bannerUrl?: string;
  
  creatorId: string;
  creatorRole: string; // Owner, Founder, Employee
  
  authorizedRepresentatives?: {
    userId: string;
    role: "Owner" | "Admin" | "Representative";
  }[];
  
  verificationLevel: VerificationLevel;
  trustScore: number; // 0 to 100
  
  // New Trust-First Fields
  isVerifiedOrganization?: boolean;
  hasVerifiedOwner?: boolean;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED";

  // Wallet & Credit System
  walletBalance?: number; // Representing usable promotional balance
  promoCredits?: number; // Tracks credits available for campaigns

  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  _id?: string;
  code: string;
  type: "FLAT" | "MULTIPLIER";
  value: number; // ₹ amount or multiplier (e.g., 2 for 2x)
  minSpend?: number;
  maxBenefit?: number;
  expiryDate: Date;
  usageLimit: number; // Global limit
  perUserLimit: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CouponRedemption {
  _id?: string;
  userId: string;
  companyId: string;
  couponId: string;
  creditsAdded: number;
  redeemedAt: Date;
}

export interface CampaignUsage {
  _id?: string;
  userId: string;
  companyId: string;
  campaignId: string; // The promotion ID or opportunity ID
  creditsUsed: number;
  timestamp: Date;
}

export interface OwnershipClaim {
  _id?: string;
  userId: string;
  companyId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  faceVerified: boolean;
  domainVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  _id?: string;
  reporterId: string;
  reportedEntityId: string;
  entityType: "USER" | "COMPANY";
  reason: string;
  status: "OPEN" | "REVIEWED";
  createdAt: Date;
}

export interface InvestmentDiscussion {
  _id?: string;
  companyId: string;
  investorId: string;
  representativeId: string; // The specific owner/rep handling this discussion
  status: "REQUESTED" | "ACTIVE" | "REJECTED" | "CLOSED";
  flagged?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type OpportunityType = "PARTNERSHIP" | "FUNDING" | "ACQUISITION" | "SERVICE_REQUEST" | "SERVICE_OFFERING";

export interface BusinessOpportunity {
  _id?: string;
  companyId: string; // The verified org posting this
  title: string;
  description: string;
  type: OpportunityType;
  budget?: string; // e.g. "$50k - $100k"
  requirements: string[];
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityResponse {
  _id?: string;
  opportunityId: string;
  responderUserId: string;
  responderCompanyId?: string; // Optional B2B
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
}

export interface Job {
  _id?: string;
  companyId: string; // References Company._id
  title: string;
  description: string;
  requirements: string[];
  experienceLevel: "Entry" | "Mid" | "Senior" | "Executive";
  employmentType: "Full-time" | "Part-time" | "Contract" | "Internship";
  locationType: "Remote" | "On-site" | "Hybrid";
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  targetPersona?: string; // Ideal candidate persona
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ApplicationStatus {
  APPLIED = "APPLIED",
  IN_REVIEW = "IN_REVIEW",
  SHORTLISTED = "SHORTLISTED",
  REJECTED = "REJECTED",
  HIRED = "HIRED"
}

export interface Application {
  _id?: string;
  jobId: string;
  userId: string;
  companyId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string; // Optional if using profile data
  matchScore?: number; // Pre-calculated alignment score
  createdAt: Date;
  updatedAt: Date;
}

export enum EventTrustLevel {
  TRUSTED = "TRUSTED",
  MODERATE = "MODERATE",
  UNVERIFIED = "UNVERIFIED"
}

export interface NexEvent {
  _id?: string;
  title: string;
  description: string;
  companyId: string; // Organizer
  attendees?: string[];
  location: string;
  locationType: "In-Person" | "Virtual" | "Hybrid";
  date: Date;
  price: number; // in cents
  category: string;
  coverImageUrl?: string;
  trustScore: number; // 0-100
  trustLevel: EventTrustLevel;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED" | "FLAGGED";
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  HELD = "HELD", // Escrow
  RELEASED = "RELEASED", // Paid to organizer
  REFUNDED = "REFUNDED"
}

export interface EscrowPayment {
  _id?: string;
  userId: string;
  eventId: string;
  amount: number; // in cents
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventRegistration {
  _id?: string;
  userId: string;
  eventId: string;
  paymentId?: string;
  ticketId: string; // Unique string
  status: "VALID" | "CHECKED_IN" | "CANCELLED";
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  APPLICATION_UPDATE = "APPLICATION_UPDATE",
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  SYSTEM = "SYSTEM",
  CONNECTION_REQUEST = "CONNECTION_REQUEST"
}

export interface Notification {
  _id?: string;
  userId: string; // The user receiving the notification
  type: NotificationType;
  content: string;
  link?: string;
  read: boolean;
  actorId?: string; // The user who triggered the action (if applicable)
  createdAt: Date;
}

export interface Post {
  _id?: string;
  authorId: string;
  content: string;
  mediaUrl?: string;
  isRepost?: boolean;
  originalPostId?: string;
  originalPost?: any; // Hydrated original post
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id?: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reaction {
  _id?: string;
  postId: string;
  authorId: string;
  type: "LIKE" | "CELEBRATE" | "SUPPORT" | "LOVE" | "INSIGHTFUL" | "FUNNY";
  createdAt: Date;
}

export enum ConnectionStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export interface Connection {
  _id?: string;
  requesterId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}
