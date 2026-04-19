import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Coupon, Company } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, companyId, baseAmount = 0 } = await request.json();
    if (!code || !companyId) {
      return NextResponse.json({ error: "Coupon code and company ID are required" }, { status: 400 });
    }

    const db = await getDb();
    
    // Validate Organization
    const company = await db.collection("companies").findOne({ _id: new ObjectId(companyId) }) as Company | null;
    if (!company) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    
    // Validate user is authorized
    const isCreator = company.creatorId === session.user.id;
    const isRep = company.authorizedRepresentatives?.some(r => r.userId === session.user.id && (r.role === "Owner" || r.role === "Admin"));
    if (!isCreator && !isRep) {
      return NextResponse.json({ error: "Only Owners and Admins can redeem coupons for the organization" }, { status: 403 });
    }

    // Validate Coupon
    const coupon = await db.collection<Coupon>("coupons").findOne({ 
      code: code.trim().toUpperCase(),
      isActive: true 
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 400 });
    }

    // Expiry check
    if (new Date() > new Date(coupon.expiryDate)) {
      // Auto mark inactive
      await db.collection("coupons").updateOne({ _id: new ObjectId(coupon._id) }, { $set: { isActive: false } });
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    // Spend check
    if (coupon.minSpend && baseAmount < coupon.minSpend) {
      return NextResponse.json({ error: `Minimum spend of ${coupon.minSpend} required` }, { status: 400 });
    }

    // Usage limits
    const globalRedemptions = await db.collection("coupon_redemptions").countDocuments({ couponId: coupon._id!.toString() });
    if (globalRedemptions >= coupon.usageLimit) {
      return NextResponse.json({ error: "This coupon's global usage limit has been reached" }, { status: 400 });
    }

    const userRedemptions = await db.collection("coupon_redemptions").countDocuments({ 
      couponId: coupon._id!.toString(), 
      companyId: companyId 
    });
    if (userRedemptions >= coupon.perUserLimit) {
      return NextResponse.json({ error: "You have already reached the redemption limit for this coupon" }, { status: 400 });
    }

    // Calculate Credits
    let creditsAdded = 0;
    if (coupon.type === "FLAT") {
      creditsAdded = coupon.value;
    } else if (coupon.type === "MULTIPLIER") {
      creditsAdded = baseAmount * coupon.value;
    }

    if (coupon.maxBenefit && creditsAdded > coupon.maxBenefit) {
      creditsAdded = coupon.maxBenefit;
    }

    // Apply Credits to Wallet
    const currentCredits = company.promoCredits || 0;
    const newCredits = currentCredits + creditsAdded;

    await db.collection("companies").updateOne(
      { _id: new ObjectId(companyId) },
      { $set: { promoCredits: newCredits } }
    );

    // Record Redemption
    await db.collection("coupon_redemptions").insertOne({
      userId: session.user.id,
      companyId,
      couponId: coupon._id!.toString(),
      creditsAdded,
      redeemedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: `${creditsAdded} promo credits added successfully!`,
      creditsAdded,
      newTotal: newCredits
    });

  } catch (error) {
    console.error("Coupon redemption error:", error);
    return NextResponse.json({ error: "Failed to redeem coupon" }, { status: 500 });
  }
}
