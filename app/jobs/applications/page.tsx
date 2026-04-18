import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getApplicationsByUser } from "@/lib/db/applications";
import { getJobById } from "@/lib/db/jobs";
import { getCompanyById } from "@/lib/db/company";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase, MapPin, ChevronRight, Clock, Target } from "lucide-react";
import Link from "next/link";
import { ApplicationStatus } from "@/lib/types";

// Helper to hydrate applications with job and company data
async function getHydratedApplications(userId: string) {
  const apps = await getApplicationsByUser(userId);
  const hydrated = await Promise.all(
    apps.map(async (app) => {
      const job = await getJobById(app.jobId);
      let company = null;
      if (job) {
        company = await getCompanyById(job.companyId);
      }
      return { ...app, job, company };
    })
  );
  return hydrated.filter(a => a.job && a.company);
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const styles = {
    [ApplicationStatus.APPLIED]: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    [ApplicationStatus.IN_REVIEW]: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    [ApplicationStatus.SHORTLISTED]: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    [ApplicationStatus.REJECTED]: "bg-red-500/10 text-red-700 border-red-500/20",
    [ApplicationStatus.HIRED]: "bg-green-500/10 text-green-700 border-green-500/20",
  };
  
  const labels = {
    [ApplicationStatus.APPLIED]: "Applied",
    [ApplicationStatus.IN_REVIEW]: "In Review",
    [ApplicationStatus.SHORTLISTED]: "Shortlisted",
    [ApplicationStatus.REJECTED]: "Not Selected",
    [ApplicationStatus.HIRED]: "Hired!",
  };

  return (
    <Badge variant="outline" className={`${styles[status]} font-medium`}>
      {labels[status]}
    </Badge>
  );
}

export default async function MyApplicationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const applications = await getHydratedApplications(session.user.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase() /* fallback */} />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-primary" /> My Applications
          </h1>
          <p className="text-muted-foreground mt-1">Track the status of your job applications.</p>
        </div>

        {applications.length === 0 ? (
          <Card className="border-border/50 bg-muted/20 text-center py-12">
            <CardContent>
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-6">You haven't applied to any jobs yet. Start exploring!</p>
              <Button asChild>
                <Link href="/jobs">Browse Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {applications.map((app) => (
              <Card key={app._id} className="border-border/50 hover:shadow-sm transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-4 items-center flex-1 min-w-0">
                      <div className="w-12 h-12 bg-card rounded-lg border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {app.company?.avatarUrl ? (
                          <img src={app.company.avatarUrl} alt={app.company.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/jobs/${app.jobId}`} className="text-lg font-semibold hover:text-primary transition-colors block truncate">
                          {app.job?.title}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                          <Link href={`/company/${app.companyId}`} className="hover:underline">
                            {app.company?.name}
                          </Link>
                          <span>•</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {app.job?.locationType === "Remote" ? "Remote" : app.job?.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                      <StatusBadge status={app.status} />
                      <div className="flex flex-col sm:items-end gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Applied on {new Date(app.createdAt).toLocaleDateString()}</span>
                        {app.matchScore !== undefined && (
                          <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {app.matchScore}% Match Score</span>
                        )}
                      </div>
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
