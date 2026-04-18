import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { NexEvent, EventRegistration, EscrowPayment, EventTrustLevel, PaymentStatus } from "@/lib/types";

export async function createEvent(data: Omit<NexEvent, "_id" | "createdAt" | "updatedAt" | "trustScore" | "trustLevel" | "status">): Promise<NexEvent> {
  const db = await getDb();
  
  // New organizers start as UNVERIFIED unless their company is STRONG verification. 
  // Let's default to MODERATE or UNVERIFIED for now, and calculate score.
  const eventData: NexEvent = {
    ...data,
    trustScore: 50,
    trustLevel: EventTrustLevel.UNVERIFIED,
    status: "UPCOMING",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<NexEvent>("events").insertOne(eventData);
  return { ...eventData, _id: result.insertedId.toString() };
}

export async function getAllActiveEvents(): Promise<NexEvent[]> {
  const db = await getDb();
  const events = await db.collection("events")
    .find({ status: { $in: ["UPCOMING", "ONGOING"] } })
    .sort({ date: 1 })
    .toArray();
  return events.map(e => ({ ...e, _id: e._id.toString() })) as unknown as Promise<NexEvent[]>;
}

export async function getEventById(id: string): Promise<NexEvent | null> {
  const db = await getDb();
  try {
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) });
    return event ? ({ ...event, _id: event._id.toString() } as unknown as NexEvent) : null;
  } catch {
    return null;
  }
}

export async function getEventsByCompany(companyId: string): Promise<NexEvent[]> {
  const db = await getDb();
  const events = await db.collection("events")
    .find({ companyId })
    .sort({ date: -1 })
    .toArray();
  return events.map(e => ({ ...e, _id: e._id.toString() })) as unknown as Promise<NexEvent[]>;
}

// Ticketing / Escrow Registration
export async function createRegistration(
  userId: string, 
  eventId: string, 
  paymentId?: string
): Promise<EventRegistration> {
  const db = await getDb();
  
  // Generate secure unique ticket ID
  const ticketId = `NEX-TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const regData: EventRegistration = {
    userId,
    eventId,
    paymentId,
    ticketId,
    status: "VALID",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<EventRegistration>("event_registrations").insertOne(regData);
  return { ...regData, _id: result.insertedId.toString() };
}

export async function hasUserRegistered(userId: string, eventId: string): Promise<boolean> {
  const db = await getDb();
  const count = await db.collection("event_registrations").countDocuments({ userId, eventId, status: { $ne: "CANCELLED" } });
  return count > 0;
}

export async function getUserRegistrationForEvent(userId: string, eventId: string): Promise<EventRegistration | null> {
  const db = await getDb();
  return db.collection<EventRegistration>("event_registrations").findOne({ userId, eventId, status: { $ne: "CANCELLED" } }) as Promise<EventRegistration | null>;
}

export async function getRegistrationByTicketId(ticketId: string): Promise<EventRegistration | null> {
  const db = await getDb();
  return db.collection<EventRegistration>("event_registrations").findOne({ ticketId }) as Promise<EventRegistration | null>;
}

export async function getRegistrationsByUser(userId: string): Promise<EventRegistration[]> {
  const db = await getDb();
  const regs = await db.collection("event_registrations")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return regs.map(r => ({ ...r, _id: r._id.toString() })) as unknown as Promise<EventRegistration[]>;
}

export async function getRegistrationsByEvent(eventId: string): Promise<EventRegistration[]> {
  const db = await getDb();
  const regs = await db.collection("event_registrations")
    .find({ eventId, status: { $ne: "CANCELLED" } })
    .sort({ createdAt: -1 })
    .toArray();
  return regs.map(r => ({ ...r, _id: r._id.toString() })) as unknown as Promise<EventRegistration[]>;
}

// Payment Escrow System
export async function createEscrowPayment(
  userId: string, 
  eventId: string, 
  amount: number, 
  razorpayOrderId: string
): Promise<EscrowPayment> {
  const db = await getDb();
  
  const payment: EscrowPayment = {
    userId,
    eventId,
    amount,
    razorpayOrderId,
    status: PaymentStatus.HELD,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<EscrowPayment>("payments").insertOne(payment);
  return { ...payment, _id: result.insertedId.toString() };
}

export async function updatePaymentStatus(
  razorpayOrderId: string, 
  razorpayPaymentId: string, 
  status: PaymentStatus
): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("payments").updateOne(
    { razorpayOrderId },
    { $set: { razorpayPaymentId, status, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}
