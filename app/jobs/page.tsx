import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAllActiveJobs } from "@/lib/db/jobs";
import { getProfileByUserId } from "@/lib/db/profile";
import { Navbar } from "@/components/navbar";
import JobBoard from "./job-board";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await getAllActiveJobs();

  // Get current user session
  const session = await auth.api.getSession({ headers: await headers() });
  
  let currentUsername = undefined;
  if (session?.user) {
    const profile = await getProfileByUserId(session.user.id);
    if (profile) currentUsername = profile.username;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={currentUsername} />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in">
        <JobBoard initialJobs={JSON.parse(JSON.stringify(jobs))} />
      </main>
    </div>
  );
}
