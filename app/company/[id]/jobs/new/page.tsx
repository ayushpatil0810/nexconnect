import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { Navbar } from "@/components/navbar";
import { getProfileByUserId } from "@/lib/db/profile";
import JobCreationForm from "./job-form";

export default async function NewJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Try fetching the company
  const company = await getCompanyById(id);
  if (!company) {
    notFound();
  }

  // Get current user session
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user || session.user.id !== company.creatorId) {
    redirect(`/company/${id}`); // Redirect non-owners back to company page
  }

  let currentUsername = undefined;
  if (session?.user) {
    const profile = await getProfileByUserId(session.user.id);
    if (profile) currentUsername = profile.username;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={currentUsername} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">
        <JobCreationForm company={JSON.parse(JSON.stringify(company))} />
      </main>
    </div>
  );
}
