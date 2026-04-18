import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { getOpportunityById } from "@/lib/db/opportunities";
import { getCompanyById } from "@/lib/db/company";
import { getUserWithProfile } from "@/lib/db/profile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, ShieldCheck, ArrowLeft, Handshake, DollarSign, Target, Briefcase, Settings } from "lucide-react";
import Link from "next/link";
import ResponseForm from "./response-form";
import { OpportunityType } from "@/lib/types";

export default async function OpportunityDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({ headers: await headers() });
  
  const opportunity = await getOpportunityById(id);
  if (!opportunity) notFound();

  const company = await getCompanyById(opportunity.companyId);
  if (!company) notFound();

  const currentUser = session?.user ? await getUserWithProfile(session.user.id) : null;
  const isVerifiedUser = currentUser?.verificationStatus === "VERIFIED" || currentUser?.onboardingComplete;

  const isOwner = session?.user?.id === company.creatorId;

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
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in flex flex-col md:flex-row gap-8">
        
        <div className="flex-1 space-y-6">
          <Link href="/marketplace" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 py-1 text-sm font-medium">
                {getIconForType(opportunity.type)} {opportunity.type.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className={opportunity.status === "OPEN" ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : ""}>
                {opportunity.status}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{opportunity.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Posted {new Date(opportunity.createdAt).toLocaleDateString()}</span>
              {opportunity.budget && (
                <span className="flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Budget: {opportunity.budget}
                </span>
              )}
            </div>
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3 border-b pb-2">Opportunity Overview</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-[15px]">
                  {opportunity.description}
                </p>
              </div>

              {opportunity.requirements && opportunity.requirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 border-b pb-2">Key Requirements</h3>
                  <ul className="space-y-2">
                    {opportunity.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground text-[15px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="w-full md:w-80 shrink-0 space-y-6 mt-8 md:mt-0">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-primary/80 to-blue-600/80"></div>
            <CardContent className="px-5 pb-5 relative">
              <div className="-mt-8 mb-3">
                <div className="w-16 h-16 bg-card rounded-xl border-4 border-card flex items-center justify-center shadow-sm overflow-hidden">
                  {company.avatarUrl ? (
                    <img src={company.avatarUrl} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              <Link href={`/company/${company._id}`} className="hover:underline">
                <h3 className="font-bold text-lg leading-tight flex items-center gap-1">
                  {company.name} {company.verificationLevel === "STRONG" && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">{company.industry}</p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm mb-5 border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{company.location || "Global"}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/50 pt-2">
                  <span className="text-muted-foreground">Trust Score</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${(company.trustScore || 0) >= 80 ? 'bg-green-500' : (company.trustScore || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{ width: `${company.trustScore || 0}%` }} 
                      />
                    </div>
                    <span className="font-bold text-primary">{company.trustScore || 0}/100</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1">
                  <span className="text-muted-foreground">Ownership Identity</span>
                  {company.hasVerifiedOwner ? (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> VERIFIED
                    </span>
                  ) : company.verificationStatus === "PENDING" ? (
                    <span className="text-yellow-600 font-semibold">PENDING</span>
                  ) : (
                    <span className="text-red-500 font-semibold">UNVERIFIED</span>
                  )}
                </div>
              </div>

              {!session?.user ? (
                <div className="text-center p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-3">Please sign in to respond to this opportunity.</p>
                  <Link href="/auth/sign-in" className="text-primary text-sm font-medium hover:underline">Sign In</Link>
                </div>
              ) : isOwner ? (
                <div className="text-center p-3 border border-primary/20 rounded-lg bg-primary/5 text-primary text-sm font-medium">
                  This is your organization's post.
                </div>
              ) : !isVerifiedUser ? (
                <div className="text-center p-3 border border-red-500/20 rounded-lg bg-red-500/5 text-red-600 text-sm">
                  You must complete your profile verification to respond to B2B opportunities.
                </div>
              ) : (
                <ResponseForm opportunityId={opportunity._id!} companyName={company.name} />
              )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
