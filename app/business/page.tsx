import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { getDiscussionsForUser } from "@/lib/db/invest";
import { getCompanyById, getCompaniesByRepresentative } from "@/lib/db/company";
import { getUserWithProfile } from "@/lib/db/profile";
import { getOpportunityResponsesForUser, getOpportunityResponsesForCompany, getOpportunityById } from "@/lib/db/opportunities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MessageSquare, ChevronRight, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function BusinessInboxPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const discussions = await getDiscussionsForUser(session.user.id);

  // Hydrate data
  const hydratedDiscussions = await Promise.all(
    discussions.map(async (d) => {
      const company = await getCompanyById(d.companyId);
      const isRepresentative = d.representativeId === session.user.id;
      const otherPartyId = isRepresentative ? d.investorId : d.representativeId;
      const otherParty = await getUserWithProfile(otherPartyId);

      return { ...d, company, otherParty, isRepresentative };
    })
  );

  // Fetch Outgoing Proposals (sent by user)
  const outgoingResponses = await getOpportunityResponsesForUser(session.user.id);
  const hydratedOutgoing = await Promise.all(
    outgoingResponses.map(async (r) => {
      const op = await getOpportunityById(r.opportunityId);
      const company = op ? await getCompanyById(op.companyId) : null;
      return { ...r, opportunity: op, company };
    })
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-primary" /> Business & Investments
          </h1>
          <p className="text-muted-foreground">
            Manage your direct, verified investment discussions and corporate communications.
          </p>
        </div>

        {hydratedDiscussions.length === 0 ? (
          <Card className="border-border/50 bg-muted/20">
            <CardContent className="pt-6 flex flex-col items-center text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Active Discussions</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                You haven't initiated or received any direct investment requests yet. 
              </p>
              <Button asChild>
                <Link href="/feed">Explore Network</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {hydratedDiscussions.map((thread) => (
              <Card key={thread._id} className="border-border/50 hover:border-primary/50 transition-colors overflow-hidden">
                <Link href={`/business/${thread._id}`}>
                  <CardContent className="p-0 flex flex-col sm:flex-row items-center cursor-pointer">
                    <div className="p-4 sm:p-6 flex-1 flex items-start gap-4 w-full">
                      <div className="w-12 h-12 rounded-full bg-muted overflow-hidden shrink-0">
                        {thread.company?.avatarUrl ? (
                          <img src={thread.company.avatarUrl} alt={thread.company.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                            <Building2 className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{thread.company?.name || "Unknown Company"}</h3>
                          <Badge variant="outline" className={`py-0 px-2 text-xs ${thread.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-600' : thread.status === 'REQUESTED' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
                            {thread.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {thread.isRepresentative ? "Incoming inquiry from:" : "Your inquiry sent to:"} <span className="font-semibold text-foreground">{thread.otherParty?.name}</span>
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> End-to-End Verified Channel • Last updated {new Date(thread.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:pr-6 w-full sm:w-auto flex justify-end border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/10 h-full items-center">
                      <Button variant="ghost" className="gap-2 text-primary">
                        View Thread <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
        {/* Opportunity Proposals Section */}
        <div className="mt-12 space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
            <FileText className="w-6 h-6 text-primary" /> Opportunity Proposals
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Outgoing Proposals */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-muted-foreground">Outgoing Proposals (Your Pitches)</h3>
              {hydratedOutgoing.length === 0 ? (
                <Card className="bg-muted/10 border-border/50">
                  <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    You haven't pitched any opportunities yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {hydratedOutgoing.map((res) => (
                    <Card key={res._id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className={res.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' : ''}>
                            {res.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(res.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold mb-1 truncate">{res.opportunity?.title}</h4>
                        <p className="text-xs text-muted-foreground mb-3">Sent to: <span className="font-semibold text-foreground">{res.company?.name}</span></p>
                        <div className="bg-muted/50 p-2 rounded-md text-sm line-clamp-2 italic border border-border/50">
                          "{res.message}"
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
