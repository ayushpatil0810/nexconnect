import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { getJobsByCompany } from "@/lib/db/jobs";
import { Navbar } from "@/components/navbar";
import { getProfileByUserId, getUserWithProfile } from "@/lib/db/profile";
import CompanyView from "./company-view";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Try fetching the company
  const company = await getCompanyById(id);
  if (!company) {
    notFound();
  }

  // Get current user session
  const session = await auth.api.getSession({ headers: await headers() });
  
  // Fetch active jobs for the company
  const jobs = await getJobsByCompany(company._id!.toString());

  // Optional: Get user profile if logged in
  let currentUsername = undefined;
  if (session?.user) {
    const profile = await getProfileByUserId(session.user.id);
    if (profile) currentUsername = profile.username;
  }

  const isOwner = session?.user?.id === company.creatorId;

  // Hydrate Authorized Representatives
  let reps = company.authorizedRepresentatives || [];
  // Ensure creator is always a representative
  if (!reps.find(r => r.userId === company.creatorId)) {
    reps.unshift({ userId: company.creatorId, role: "Owner" });
  }

  const hydratedReps = await Promise.all(
    reps.map(async (rep) => {
      const userProfile = await getUserWithProfile(rep.userId);
      return { ...rep, user: userProfile };
    })
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={currentUsername} />
      <CompanyView 
        company={JSON.parse(JSON.stringify(company))} 
        jobs={JSON.parse(JSON.stringify(jobs))}
        representatives={JSON.parse(JSON.stringify(hydratedReps))}
        isOwner={isOwner} 
        currentUserId={session?.user?.id}
      />
    </div>
  );
}
