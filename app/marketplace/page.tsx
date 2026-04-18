import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { getAllOpenOpportunities } from "@/lib/db/opportunities";
import { getCompanyById } from "@/lib/db/company";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Briefcase, Building2, Handshake, DollarSign, Target, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { OpportunityType } from "@/lib/types";

export default async function MarketplacePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const opportunities = await getAllOpenOpportunities();

  const hydratedOps = await Promise.all(
    opportunities.map(async (op) => {
      const company = await getCompanyById(op.companyId);
      return { ...op, company };
    })
  );

  const getIconForType = (type: OpportunityType) => {
    switch(type) {
      case "PARTNERSHIP": return <Handshake className="w-5 h-5" />;
      case "FUNDING": return <DollarSign className="w-5 h-5" />;
      case "ACQUISITION": return <Target className="w-5 h-5" />;
      case "SERVICE_REQUEST": return <Briefcase className="w-5 h-5" />;
      case "SERVICE_OFFERING": return <Settings className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session?.user?.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 animate-fade-in flex flex-col sm:flex-row gap-8">
        
        {/* Left Sidebar - Filters (Mock UI for now) */}
        <aside className="w-full sm:w-64 shrink-0 space-y-6">
          <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold mb-4 text-lg">B2B Exchange</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Discover verified business opportunities, strategic partnerships, and B2B service requests.
            </p>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start font-normal">All Opportunities</Button>
              <Button variant="ghost" className="w-full justify-start font-normal text-muted-foreground">Partnerships</Button>
              <Button variant="ghost" className="w-full justify-start font-normal text-muted-foreground">Funding & Investment</Button>
              <Button variant="ghost" className="w-full justify-start font-normal text-muted-foreground">Acquisitions</Button>
              <Button variant="ghost" className="w-full justify-start font-normal text-muted-foreground">Service Exchange</Button>
            </div>
          </div>

          <Card className="border-border/50 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-bold text-primary flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4" /> Trusted Network
              </h3>
              <p className="text-xs text-muted-foreground">
                All organizations posting on the marketplace must pass strong verification checks to ensure secure transactions.
              </p>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content - Listings */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">Marketplace Listings</h1>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              {hydratedOps.length} Active
            </Badge>
          </div>

          {hydratedOps.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/50 rounded-xl shadow-sm">
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Marketplace is quiet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                There are no open B2B opportunities right now. Verified organizations can post new opportunities from their dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {hydratedOps.map((op) => (
                <Card key={op._id} className="border-border/50 hover:border-primary/40 transition-colors shadow-sm">
                  <CardContent className="p-5 flex flex-col sm:flex-row gap-5">
                    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/50">
                      {op.company?.avatarUrl ? (
                        <img src={op.company.avatarUrl} alt={op.company.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="gap-1.5 py-0.5 font-medium">
                              {getIconForType(op.type)} {op.type.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(op.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-lg font-bold hover:text-primary transition-colors">
                            <Link href={`/marketplace/${op._id}`}>{op.title}</Link>
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Link href={`/company/${op.companyId}`} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                              {op.company?.name || "Verified Organization"} {op.company?.hasVerifiedOwner && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                            </Link>
                            <span className="text-muted-foreground text-xs">•</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trust Score:</span>
                              <span className={`text-xs font-bold ${(op.company?.trustScore || 0) >= 80 ? 'text-green-600' : (op.company?.trustScore || 0) >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                                {op.company?.trustScore || 0}/100
                              </span>
                            </div>
                          </div>
                        </div>
                        {op.budget && (
                          <div className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-3 py-1 rounded-lg text-sm font-bold shrink-0 whitespace-nowrap h-fit">
                            {op.budget}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-3 mb-4">
                        {op.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/50 mt-auto">
                        <div className="flex gap-2">
                          {op.requirements.slice(0, 3).map((req: string, i: number) => (
                            <span key={i} className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-md border border-border/50">
                              {req}
                            </span>
                          ))}
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/marketplace/${op._id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
