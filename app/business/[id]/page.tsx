import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { getDiscussionById, getMessagesForDiscussion } from "@/lib/db/invest";
import { getCompanyById } from "@/lib/db/company";
import { getUserWithProfile } from "@/lib/db/profile";
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import ThreadView from "./thread-view";

export default async function DiscussionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const discussion = await getDiscussionById(id);
  if (!discussion) notFound();

  // Security constraint: User must be part of this discussion
  if (discussion.investorId !== session.user.id && discussion.representativeId !== session.user.id) {
    notFound();
  }

  const messages = await getMessagesForDiscussion(id);
  const company = await getCompanyById(discussion.companyId);
  if (!company) notFound();

  const isRepresentative = discussion.representativeId === session.user.id;
  const otherPartyId = isRepresentative ? discussion.investorId : discussion.representativeId;
  const otherParty = await getUserWithProfile(otherPartyId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in flex flex-col">
        
        <Link href="/business" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6 text-sm w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Business Inbox
        </Link>

        <div className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <Badge variant="outline" className={`py-0 px-2 text-xs ${discussion.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-600' : discussion.status === 'REQUESTED' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
                {discussion.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Secure investment channel with <span className="font-semibold text-foreground">{otherParty?.name}</span>
            </p>
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs flex items-start gap-2 max-w-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-emerald-700 leading-relaxed">
              <strong>Verified Channel</strong><br/>
              Identity validated by NexConnect. 0% Broker interference.
            </p>
          </div>
        </div>

        <div className="flex-1 bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col">
          <ThreadView 
            discussionId={discussion._id!} 
            initialMessages={JSON.parse(JSON.stringify(messages))} 
            currentUserId={session.user.id}
            otherPartyName={otherParty?.name || "Verified User"}
            otherPartyAvatar={otherParty?.image || undefined}
            status={discussion.status}
            isRepresentative={isRepresentative}
          />
        </div>
      </main>
    </div>
  );
}
