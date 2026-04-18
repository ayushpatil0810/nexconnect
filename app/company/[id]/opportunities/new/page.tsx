import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { Navbar } from "@/components/navbar";
import OpportunityForm from "./opportunity-form";

export default async function NewOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const company = await getCompanyById(id);
  if (!company) notFound();

  // Validate authorization - only owner or admin can post opportunities
  let reps = company.authorizedRepresentatives || [];
  if (!reps.find(r => r.userId === company.creatorId)) {
    reps.unshift({ userId: company.creatorId, role: "Owner" });
  }

  const userRole = reps.find(r => r.userId === session.user.id)?.role;
  if (!userRole || (userRole !== "Owner" && userRole !== "Admin")) {
    redirect(`/company/${id}`);
  }

  // Enforce trust limit (only highly verified companies can post opportunities)
  if (company.verificationLevel !== "STRONG") {
    redirect(`/company/${id}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">
        <OpportunityForm companyId={id} companyName={company.name} />
      </main>
    </div>
  );
}
