import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

/**
 * GET /api/coupon/seed
 *
 * Seeds a mock promotional coupon "STARTER500" that grants 500 flat credits.
 * Idempotent — will not create duplicates if the coupon already exists.
 */
export async function GET() {
  try {
    const db = await getDb();

    const existing = await db.collection("coupons").findOne({ code: "STARTER500" });
    if (existing) {
      return NextResponse.json({
        message: "Coupon STARTER500 already exists",
        coupon: existing,
      });
    }

    const coupon = {
      code: "STARTER500",
      type: "FLAT" as const,
      value: 500,
      minSpend: 0,
      maxBenefit: 500,
      expiryDate: new Date("2027-12-31T23:59:59Z"),
      usageLimit: 1000,
      perUserLimit: 1,
      isActive: true,
      createdAt: new Date(),
    };

    const result = await db.collection("coupons").insertOne(coupon);

    return NextResponse.json({
      message: "Mock coupon STARTER500 created successfully! Redeem it in the Promotion Wallet for 500 credits.",
      coupon: { ...coupon, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Coupon seed error:", error);
    return NextResponse.json({ error: "Failed to seed coupon" }, { status: 500 });
  }
}
