import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real system, you would check if the user is a platform admin here
    
    const db = await getDb();
    
    // 1. Coupon Stats
    const totalCoupons = await db.collection("coupons").countDocuments();
    const activeCoupons = await db.collection("coupons").countDocuments({ isActive: true });
    
    const now = new Date();
    const expiredCoupons = await db.collection("coupons").countDocuments({ 
      expiryDate: { $lt: now } 
    });

    // 2. Redemption Stats
    const redemptions = await db.collection("coupon_redemptions").find().toArray();
    const totalRedemptions = redemptions.length;
    const totalCreditsIssued = redemptions.reduce((acc, curr) => acc + (curr.creditsAdded || 0), 0);

    // 3. Campaign Usage Stats
    const usageRecords = await db.collection("campaign_usages").find().toArray();
    const totalCampaignsRun = usageRecords.length;
    const totalCreditsUsed = usageRecords.reduce((acc, curr) => acc + (curr.creditsUsed || 0), 0);

    return NextResponse.json({
      overview: {
        totalCreditsIssued,
        totalCreditsUsed,
        netCirculatingCredits: totalCreditsIssued - totalCreditsUsed
      },
      coupons: {
        total: totalCoupons,
        active: activeCoupons,
        expired: expiredCoupons,
        totalRedemptions
      },
      campaigns: {
        totalCampaignsRun
      }
    });

  } catch (error) {
    console.error("Coupon Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
