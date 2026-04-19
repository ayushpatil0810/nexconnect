import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { getDb } from "@/lib/mongodb";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone, TrendingUp, Users, Target, ShieldCheck, ExternalLink, BarChart3, MousePointerClick, Eye, ArrowUpRight, UserCheck } from "lucide-react";
import Link from "next/link";
import CouponRedeem from "./coupon-redeem";
import CreateCampaignModal from "./create-campaign-modal";

export default async function PromotionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const company = await getCompanyById(id);
  if (!company) notFound();

  // Validate authorization - only owner or admin can manage promotions
  let reps = company.authorizedRepresentatives || [];
  if (!reps.find(r => r.userId === company.creatorId)) {
    reps.unshift({ userId: company.creatorId, role: "Owner" });
  }

  const userRole = reps.find(r => r.userId === session.user.id)?.role;
  if (!userRole || (userRole !== "Owner" && userRole !== "Admin")) {
    redirect(`/company/${id}`);
  }

  // Enforce trust limit
  if (company.verificationLevel !== "STRONG") {
    redirect(`/company/${id}`);
  }

  // Fetch real campaigns
  const db = await getDb();
  const campaigns = await db.collection("campaigns").find({ companyId: id }).sort({ createdAt: -1 }).toArray();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 animate-fade-in">

        <Link href={`/company/${id}`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <Megaphone className="w-8 h-8 text-primary" /> Promotion Engine
            </h1>
            <p className="text-muted-foreground">
              Boost your brand visibility, sponsor events, and reach targeted professional audiences.
            </p>
          </div>
          <CreateCampaignModal companyId={id} availableCredits={company.promoCredits || 0} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-card">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-1">12.4k</h3>
              <p className="text-sm text-muted-foreground">Total Brand Impressions</p>
              <div className="mt-4 text-xs font-semibold text-emerald-500 bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
                +24% this week
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-card">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-1">842</h3>
              <p className="text-sm text-muted-foreground">Profile Visitors</p>
              <div className="mt-4 text-xs font-semibold text-emerald-500 bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
                +12% this week
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-card">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-1">4.2%</h3>
              <p className="text-sm text-muted-foreground">Avg. Conversion Rate</p>
              <div className="mt-4 text-xs font-semibold text-muted-foreground bg-muted w-fit px-2 py-1 rounded-md">
                Stable
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold">Campaign History</h2>

            {campaigns.length === 0 ? (
              <Card className="border-border/50 border-dashed bg-muted/30">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-bold text-lg mb-2">No active campaigns</h3>
                  <p className="text-sm max-w-sm mx-auto">Use your promotional credits to launch targeted B2B ad campaigns and boost your visibility.</p>
                </CardContent>
              </Card>
            ) : (
              campaigns.map(camp => {
                // Use stored analytics if available, otherwise generate deterministic mock
                const seed = parseInt(camp._id.toString().substring(18), 16) || 1234;
                const analytics = camp.analytics || {
                  impressions: (seed % 50) * 120 + 400,
                  clicks: Math.floor(((seed % 50) * 120 + 400) * (0.02 + (seed % 10) * 0.01)),
                  ctr: parseFloat(((0.02 + (seed % 10) * 0.01) * 100).toFixed(1)),
                  conversions: Math.floor(((seed % 50) * 120 + 400) * (0.02 + (seed % 10) * 0.01) * 0.03),
                  conversionRate: 3.0,
                  reach: Math.floor(((seed % 50) * 120 + 400) * 0.75),
                  spent: camp.budget,
                };

                return (
                  <Card key={camp._id.toString()} className="border-border/50 overflow-hidden relative">
                    <div className={`absolute top-0 left-0 w-1 h-full ${camp.status === 'RUNNING' ? 'bg-emerald-500' : camp.status === 'PAUSED' ? 'bg-amber-500' : 'bg-muted'}`}></div>
                    <CardContent className="p-6">
                      {/* Header row */}
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className={camp.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : camp.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'text-muted-foreground'}>
                          {camp.status}
                        </Badge>
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1">
                            {camp.budget} <span className="text-[9px] uppercase font-semibold opacity-75">Credits</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(camp.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-lg mb-1">{camp.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">Target: {camp.targetAudience}</p>

                      {/* Promoted Post Link */}
                      {camp.postUrl && (
                        <a
                          href={camp.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-2.5 mb-4 rounded-lg bg-muted/40 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <ExternalLink className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Promoted Content</p>
                            <p className="text-sm truncate text-foreground group-hover:text-primary transition-colors">{camp.postUrl}</p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </a>
                      )}

                      {/* Analytics Grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                        <div className="bg-muted/30 rounded-lg p-2.5 text-center border border-border/40">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Eye className="w-3 h-3 text-blue-500" />
                          </div>
                          <p className="font-bold text-sm text-foreground">{analytics.impressions.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Impressions</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2.5 text-center border border-border/40">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <MousePointerClick className="w-3 h-3 text-violet-500" />
                          </div>
                          <p className="font-bold text-sm text-foreground">{analytics.clicks.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Clicks</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2.5 text-center border border-border/40">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <BarChart3 className="w-3 h-3 text-primary" />
                          </div>
                          <p className="font-bold text-sm text-primary">{analytics.ctr}%</p>
                          <p className="text-[10px] text-muted-foreground">CTR</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2.5 text-center border border-border/40">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="w-3 h-3 text-emerald-500" />
                          </div>
                          <p className="font-bold text-sm text-foreground">{analytics.conversions.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Conversions</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2.5 text-center border border-border/40">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-amber-500" />
                          </div>
                          <p className="font-bold text-sm text-foreground">{analytics.conversionRate}%</p>
                          <p className="text-[10px] text-muted-foreground">Conv. Rate</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2.5 text-center border border-border/40">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <UserCheck className="w-3 h-3 text-cyan-500" />
                          </div>
                          <p className="font-bold text-sm text-foreground">{analytics.reach.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Reach</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {camp.status === 'RUNNING' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs h-8">Pause Campaign</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <aside className="space-y-6">
            <Card className="border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Verified Ad Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  NexConnect's promotion engine guarantees your content is only shown to verified human profiles. Zero bots, zero click-fraud.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Precision Industry Targeting
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Sponsored Event Placements
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> B2B Marketplace Highlighting
                  </li>
                </ul>
              </CardContent>
            </Card>

            <CouponRedeem companyId={id} initialCredits={company.promoCredits || 0} />
          </aside>
        </div>
      </main>
    </div>
  );
}
