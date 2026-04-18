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
  
  createdAt: Date;
  updatedAt: Date;
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
  
  verificationLevel: VerificationLevel;
  trustScore: number; // 0 to 100
  
  createdAt: Date;
  updatedAt: Date;
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
