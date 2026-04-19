"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, TicketPercent, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CouponRedeem({ companyId, initialCredits }: { companyId: string, initialCredits: number }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(initialCredits || 0);
  const router = useRouter();

  // Keep credits in sync when server re-renders after campaign spend or coupon redeem
  useEffect(() => {
    setCredits(initialCredits || 0);
  }, [initialCredits]);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    try {
      const res = await fetch("/api/coupon/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, companyId })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || `Promo credits added successfully!`);
        setCredits(data.newTotal);
        setCode("");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to redeem coupon");
      }
    } catch {
      toast.error("An error occurred during redemption");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/50 shadow-sm mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span className="flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /> Promotion Wallet</span>
          <span className="text-2xl font-bold text-foreground">
            {credits.toLocaleString()} <span className="text-sm font-normal text-muted-foreground uppercase tracking-wider">Credits</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Redeem promotional coupons or referral multipliers to fuel your active ad campaigns without spending fiat balance.
        </p>
        <form onSubmit={handleRedeem} className="flex gap-2">
          <Input 
            placeholder="Enter promo code (e.g. GROWTH2X)" 
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono uppercase"
          />
          <Button type="submit" disabled={loading || !code} className="shrink-0 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TicketPercent className="w-4 h-4" />}
            Apply Coupon
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
