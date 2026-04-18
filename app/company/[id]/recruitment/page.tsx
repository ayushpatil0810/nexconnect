import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { getJobsByCompany } from "@/lib/db/jobs";
import { getApplicationsByJob } from "@/lib/db/applications";
import { getProfileByUserId } from "@/lib/db/profile";
import { Navbar } from "@/components/navbar";
import RecruitmentDashboard from "./recruitment-dashboard";

export default async function CompanyRecruitmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const company = await getCompanyById(id);
  if (!company) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });
  
  // Security check: Only company owners can see recruitment dashboard
  if (!session?.user || session.user.id !== company.creatorId) {
    redirect(`/company/${id}`);
  }

  // Fetch all jobs for this company
  const jobs = await getJobsByCompany(company._id!.toString());

  // Fetch all applications for all jobs, and hydrate with applicant profiles
  const jobsWithApplications = await Promise.all(
    jobs.map(async (job) => {
      const applications = await getApplicationsByJob(job._id!.toString());
      
      const hydratedApps = await Promise.all(
        applications.map(async (app) => {
          const applicantProfile = await getProfileByUserId(app.userId);
          return {
            ...app,
            applicant: applicantProfile
          };
        })
      );
      
      return {
        ...job,
        applications: hydratedApps
      };
    })
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 animate-fade-in">
        <RecruitmentDashboard 
          company={JSON.parse(JSON.stringify(company))} 
          jobsWithApplications={JSON.parse(JSON.stringify(jobsWithApplications))} 
        />
      </main>
    </div>
  );
}
