import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { getProfileByUserId } from "@/lib/db/profile";
import { getDb } from "@/lib/mongodb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Link as LinkIcon, Lock, Unlock, CheckCircle2, TrendingUp, Medal } from "lucide-react";
import LeaderboardList from "./leaderboard-list";

export default async function RewardsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) {
    redirect("/onboarding");
  }

  const db = await getDb();
  const rewards = await db.collection("rewards").find({ userId: session.user.id }).toArray();
  const earnedCoupons = await db.collection("coupons").find({ earnedByUserId: session.user.id }).toArray();
  
  const MILESTONES = [1, 5, 10, 50, 100];
  const total = profile.referralCount || 0;
  const verified = profile.verifiedReferralCount || 0;
  const conversionRate = total > 0 ? ((verified / total) * 100).toFixed(1) : 0;
  const nextMilestone = MILESTONES.find(m => verified < m) || 100;
  const progressToNext = verified >= 100 ? 100 : (verified / nextMilestone) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={profile.username} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Growth & Rewards
          </h1>
          <p className="text-muted-foreground mt-2">
            Invite colleagues to NexConnect and unlock exclusive platform tiers. Only verified professionals count towards your milestone progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/50 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5" /> Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-background border rounded-lg mb-3">
                <code className="text-sm font-semibold flex-1">
                  {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/sign-up?ref={profile.referralCode}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this unique link. Your code is <strong className="text-primary">{profile.referralCode}</strong>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Impact Metrics</span>
                <span className="text-xs font-medium bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">{conversionRate}% Conv. Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8 mb-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">{verified}</p>
                  <p className="text-sm text-muted-foreground">Verified Referrals</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-muted-foreground">{total}</p>
                  <p className="text-sm text-muted-foreground">Total Invites</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-muted-foreground">Progress to Tier {nextMilestone}</span>
                  <span className="text-primary">{verified} / {nextMilestone}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressToNext}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-4">Milestone Unlocks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {MILESTONES.map(ms => {
            const unlocked = (profile.verifiedReferralCount || 0) >= ms;
            const reward = rewards.find(r => r.milestone === ms);
            return (
              <Card key={ms} className={`border-border/50 transition-colors ${unlocked ? 'border-primary/50 bg-primary/5' : 'opacity-70'}`}>
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${unlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {unlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{ms} Referrals</h3>
                  <p className="text-xs text-muted-foreground mb-4">Unlock Platform Tier {ms}</p>
                  {reward && reward.status === "CLAIMED" ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                    </span>
                  ) : unlocked ? (
                    <span className="text-xs font-semibold text-primary border border-primary/20 px-3 py-1 rounded-full bg-background">
                      Reward Unlocked
                    </span>
                  ) : (
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-primary/40 rounded-full" style={{ width: `${((profile.verifiedReferralCount || 0) / ms) * 100}%` }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Your Earned Coupons</h2>
          {earnedCoupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {earnedCoupons.map((coupon, i) => (
                <Card key={i} className={`border-border/50 ${coupon.isActive ? 'bg-emerald-500/5 border-emerald-500/20' : 'opacity-50'}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1">
                        {coupon.type === "MULTIPLIER" ? `${coupon.value}x Multiplier` : `₹${coupon.value} Flat Bonus`}
                      </p>
                      <code className="text-lg font-bold text-primary font-mono select-all">
                        {coupon.code}
                      </code>
                    </div>
                    <div className="text-right">
                      {coupon.isActive ? (
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 font-bold px-2 py-1 rounded">ACTIVE</span>
                      ) : (
                        <span className="text-xs bg-muted text-muted-foreground font-bold px-2 py-1 rounded">USED / EXPIRED</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/50 border-dashed bg-muted/30">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground font-medium mb-1">No coupons earned yet.</p>
                <p className="text-sm text-muted-foreground">Unlock verification milestones to automatically receive exclusive campaign multipliers and flat credit bonuses!</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="border-t border-border/50 pt-10">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Global Growth Leaderboard</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            These professionals are driving the fastest verified growth on NexConnect. Top performers unlock exclusive investor matching privileges.
          </p>
          <LeaderboardList />
        </div>
      </main>
    </div>
  );
}
