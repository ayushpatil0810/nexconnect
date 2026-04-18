import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { getUserWithProfile } from "@/lib/db/profile";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ArrowLeft, Send, ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";
import InvestForm from "./invest-form";

export default async function InvestPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ repId: string }> }) {
  const { id } = await params;
  const { repId } = await searchParams;

  if (!repId) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const company = await getCompanyById(id);
  if (!company) notFound();

  // Validate the rep is actually an authorized representative or owner
  let reps = company.authorizedRepresentatives || [];
  if (!reps.find(r => r.userId === company.creatorId)) {
    reps.unshift({ userId: company.creatorId, role: "Owner" });
  }

  const targetRep = reps.find(r => r.userId === repId);
  if (!targetRep) {
    notFound(); // Not an authorized rep
  }

  const targetUser = await getUserWithProfile(repId);
  if (!targetUser) notFound();

  const currentUser = await getUserWithProfile(session.user.id);

  // Simple unverified investor guard (anti-middleman)
  // Investors must be somewhat verified to initiate contact. For hackathon, just ensure onboarding is complete.
  const isInvestorVerified = currentUser?.verificationStatus === "VERIFIED" || currentUser?.onboardingComplete;

  // STRICT TRUST GUARD
  const isCompanyTrusted = company.hasVerifiedOwner || company.verificationStatus === "VERIFIED";
  const isValidRole = targetRep.role === "Owner" || targetRep.role === "Representative" || targetRep.role === "Admin";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 animate-fade-in">
        
        <Link href={`/company/${id}`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Company Profile
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            Initiate Investment Discussion
          </h1>
          <p className="text-muted-foreground">
            Connect directly with verified representatives of <span className="font-semibold">{company.name}</span>. NexConnect guarantees 0% broker interference.
          </p>
        </div>

        {!isCompanyTrusted || !isValidRole ? (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Organization Not Verified</h2>
              <p className="text-muted-foreground mb-4">
                Access restricted to verified organization representatives. This company has not yet established a verified owner, or the representative lacks sufficient authority.
              </p>
            </CardContent>
          </Card>
        ) : !isInvestorVerified ? (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Verification Required</h2>
              <p className="text-muted-foreground mb-4">
                To prevent spam and unauthorized middlemen, all investors must verify their identity before initiating secure investment discussions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-border/50 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden shrink-0">
                  {targetUser.image ? (
                    <img src={targetUser.image} alt={targetUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                      {targetUser.name?.[0] || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{targetUser.name}</h3>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-0.5 px-2 gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified {targetRep.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You are initiating a direct, end-to-end encrypted communication request. This interaction is logged for security purposes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <InvestForm companyId={company._id!} repId={repId} />
            
            <div className="flex gap-2 text-xs text-muted-foreground items-start bg-muted/30 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-500" />
              <p>
                <strong>Anti-Fraud Warning:</strong> NexConnect strictly monitors for impersonation and unauthorized brokering. If this representative attempts to redirect you to an unverified third party, please report the interaction immediately.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
