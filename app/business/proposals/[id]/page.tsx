import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { getOpportunityById } from "@/lib/db/opportunities";
import { getCompanyById, getCompaniesByRepresentative } from "@/lib/db/company";
import { getUserWithProfile } from "@/lib/db/profile";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Building2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import ReviewActions from "./review-actions";

export default async function ProposalReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/sign-in");

  const db = await getDb();
  const response = await db.collection("opportunity_responses").findOne({ _id: new ObjectId(id) });
  if (!response) notFound();

  const opportunity = await getOpportunityById(response.opportunityId);
  if (!opportunity) notFound();

  const company = await getCompanyById(opportunity.companyId);
  if (!company) notFound();

  // Security: Ensure current user is an authorized representative of the company
  const myCompanies = await getCompaniesByRepresentative(session.user.id);
  const isAuthorized = myCompanies.some(c => c._id?.toString() === company._id?.toString());
  
  if (!isAuthorized) notFound(); // Only reps can view proposals submitted to their company

  const responder = await getUserWithProfile(response.responderUserId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 animate-fade-in">
        
        <Link href="/business" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Business Inbox
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            Review Proposal
          </h1>
          <p className="text-muted-foreground">
            Regarding: <Link href={`/marketplace/${opportunity._id}`} className="font-semibold text-primary hover:underline">{opportunity.title}</Link>
          </p>
        </div>

        <div className="space-y-6">
          {/* Responder Profile Summary */}
          <Card className="border-border/50 bg-primary/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted overflow-hidden shrink-0">
                {responder?.image ? (
                  <img src={responder.image} alt={responder.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-lg">{responder?.name || "Verified User"}</h3>
                  <Badge variant="outline" className={response.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' : response.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}>
                    {response.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{responder?.headline || "Platform Member"}</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                    <Link href={`/profile/${responder?.username || responder?._id}`}>View Full Profile</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Content */}
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Submitted Pitch / Message</h3>
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 leading-relaxed whitespace-pre-line">
                {response.message}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {response.status === "PENDING" ? (
            <ReviewActions responseId={id} />
          ) : (
            <Card className={`border ${response.status === 'ACCEPTED' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <CardContent className="p-6 text-center flex flex-col items-center">
                {response.status === 'ACCEPTED' ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <h3 className="font-bold text-emerald-700 mb-1">Proposal Accepted</h3>
                    <p className="text-sm text-emerald-600/80">You can now contact this user directly or initiate a formal investment channel.</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-500 mb-2" />
                    <h3 className="font-bold text-red-700 mb-1">Proposal Declined</h3>
                    <p className="text-sm text-red-600/80">This application was rejected.</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
