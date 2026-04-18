import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { getOpportunityResponsesForCompany, getOpportunityById } from "@/lib/db/opportunities";
import { getUserWithProfile } from "@/lib/db/profile";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

export default async function ManageProposalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/sign-in");

  const company = await getCompanyById(id);
  if (!company) notFound();

  // Validate authorization
  let reps = company.authorizedRepresentatives || [];
  if (!reps.find(r => r.userId === company.creatorId)) {
    reps.unshift({ userId: company.creatorId, role: "Owner" });
  }

  const isAuthorized = reps.find(r => r.userId === session.user.id);
  if (!isAuthorized) redirect(`/company/${id}`);

  // Fetch proposals specifically for this company
  const responses = await getOpportunityResponsesForCompany(id);
  
  const hydratedResponses = await Promise.all(
    responses.map(async (r) => {
      const op = await getOpportunityById(r.opportunityId);
      const responder = await getUserWithProfile(r.responderUserId);
      return { ...r, opportunity: op, responder };
    })
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">
        
        <Link href={`/company/${id}`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-primary" /> Manage Proposals
          </h1>
          <p className="text-muted-foreground">
            Review inbound pitches and investment responses for <span className="font-semibold text-foreground">{company.name}</span>.
          </p>
        </div>

        {hydratedResponses.length === 0 ? (
          <Card className="bg-muted/10 border-border/50">
            <CardContent className="p-12 text-center flex flex-col items-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Active Proposals</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                You haven't received any responses to your marketplace opportunities yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {hydratedResponses.map((res) => (
              <Card key={res._id} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={
                          res.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' : 
                          res.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600' : 
                          'bg-red-500/10 text-red-600'
                        }>
                          {res.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{new Date(res.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-lg mb-1">{res.opportunity?.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        From: <span className="font-semibold text-foreground">{res.responder?.name}</span>
                      </p>
                      <div className="bg-muted/50 p-3 rounded-xl text-sm line-clamp-3 italic border border-border/50 text-muted-foreground">
                        "{res.message}"
                      </div>
                    </div>
                    <div className="w-full sm:w-auto shrink-0 flex items-center justify-end h-full mt-4 sm:mt-0 sm:pl-6 sm:border-l border-border/50">
                      <Button asChild>
                        <Link href={`/business/proposals/${res._id}`} className="gap-2">
                          Review <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
