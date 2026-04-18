"use client";

import { useState } from "react";
import { Company, Job, Application, ApplicationStatus, Profile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, FileText, Target, MapPin, Search, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HydratedApplication extends Application {
  applicant: Profile | null;
}

interface JobWithApplications extends Job {
  applications: HydratedApplication[];
}

interface RecruitmentDashboardProps {
  company: Company;
  jobsWithApplications: JobWithApplications[];
}

export default function RecruitmentDashboard({ company, jobsWithApplications }: RecruitmentDashboardProps) {
  const router = useRouter();
  const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setUpdating(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, companyId: company._id }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Applicant status updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setUpdating(null);
    }
  };

  const filteredJobs = selectedJobId === "ALL" 
    ? jobsWithApplications 
    : jobsWithApplications.filter(j => j._id === selectedJobId);

  const totalApplications = jobsWithApplications.reduce((acc, job) => acc + job.applications.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" /> Recruitment Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage applications for {company.name}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/company/${company._id}`}>Back to Company</Link>
          </Button>
          <Button asChild>
            <Link href={`/company/${company._id}/jobs/new`}>Post New Job</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Postings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{jobsWithApplications.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{totalApplications}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Filter by Job</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="All Jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Jobs</SelectItem>
                {jobsWithApplications.map(job => (
                  <SelectItem key={job._id} value={job._id!}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {filteredJobs.length === 0 ? (
        <Card className="border-border/50 py-12 text-center bg-muted/20">
          <CardContent>
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground">You haven't posted any jobs yet, or no jobs match this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredJobs.map(job => (
            <Card key={job._id} className="border-border/50 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl">
                      <Link href={`/jobs/${job._id}`} className="hover:text-primary transition-colors hover:underline">
                        {job.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{job.applications.length} Applicants</span>
                      <span>•</span>
                      <span>{job.employmentType}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {job.applications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">No applications for this role yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {job.applications.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).map((app) => (
                      <div key={app._id} className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex flex-col md:flex-row gap-6">
                        {/* Applicant Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-12 h-12 border border-border">
                            <AvatarImage src={app.applicant?.avatarUrl || ""} />
                            <AvatarFallback>{app.applicant?.username?.substring(0, 2).toUpperCase() || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-base truncate">{app.applicant?.username || "Unknown User"}</h4>
                              <Link href={`/profile/${app.applicant?.username}`} target="_blank" className="text-muted-foreground hover:text-primary">
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{app.applicant?.headline || "No headline provided"}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                              {app.applicant?.country && (
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {app.applicant.country}</span>
                              )}
                              <span className="flex items-center gap-1 text-primary">
                                <Target className="w-3.5 h-3.5" /> {app.matchScore || 0}% Match
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cover Letter Snapshot */}
                        {app.coverLetter && (
                          <div className="flex-1 bg-muted/30 rounded-lg p-3 text-sm">
                            <p className="font-medium mb-1 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Cover Letter</p>
                            <p className="text-muted-foreground line-clamp-3 italic">"{app.coverLetter}"</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="md:w-48 flex flex-col gap-2 shrink-0">
                          <Label className="text-xs text-muted-foreground">Application Status</Label>
                          <Select 
                            value={app.status} 
                            onValueChange={(val) => handleStatusChange(app._id!, val)}
                            disabled={updating === app._id}
                          >
                            <SelectTrigger className={`
                              ${app.status === 'APPLIED' ? 'bg-blue-500/10 text-blue-700' : ''}
                              ${app.status === 'IN_REVIEW' ? 'bg-yellow-500/10 text-yellow-700' : ''}
                              ${app.status === 'SHORTLISTED' ? 'bg-purple-500/10 text-purple-700' : ''}
                              ${app.status === 'REJECTED' ? 'bg-red-500/10 text-red-700' : ''}
                              ${app.status === 'HIRED' ? 'bg-green-500/10 text-green-700' : ''}
                            `}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ApplicationStatus.APPLIED}>Applied</SelectItem>
                              <SelectItem value={ApplicationStatus.IN_REVIEW}>In Review</SelectItem>
                              <SelectItem value={ApplicationStatus.SHORTLISTED}>Shortlisted</SelectItem>
                              <SelectItem value={ApplicationStatus.HIRED}>Hired</SelectItem>
                              <SelectItem value={ApplicationStatus.REJECTED}>Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
