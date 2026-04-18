import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getJobById } from "@/lib/db/jobs";
import { getCompanyById } from "@/lib/db/company";
import { getProfileByUserId } from "@/lib/db/profile";
import { hasUserApplied, getUserApplicationForJob } from "@/lib/db/applications";
import { generateMatchAnalysis } from "@/lib/matching";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase, MapPin, DollarSign, CheckCircle2, XCircle, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import ApplyButton from "./apply-button";

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const job = await getJobById(id);
  if (!job) {
    notFound();
  }

  const company = await getCompanyById(job.companyId);
  if (!company) {
    notFound(); // Edge case where company was deleted
  }

  // Get current user session
  const session = await auth.api.getSession({ headers: await headers() });
  
  let currentUsername = undefined;
  let matchAnalysis = null;
  let alreadyApplied = false;
  let applicationStatus = null;
  let isOwner = false;
  
  if (session?.user) {
    isOwner = session.user.id === company.creatorId;
    
    if (!isOwner) {
      const existingApp = await getUserApplicationForJob(session.user.id, job._id!.toString());
      alreadyApplied = !!existingApp;
      applicationStatus = existingApp?.status || null;
    }
    
    const profile = await getProfileByUserId(session.user.id);
    if (profile) {
      currentUsername = profile.username;
      matchAnalysis = generateMatchAnalysis(profile, job);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={currentUsername} />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-16 h-16 bg-card rounded-xl border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {company.avatarUrl ? (
                      <img src={company.avatarUrl} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                    <div className="text-lg text-muted-foreground mb-4">
                      <Link href={`/company/${company._id}`} className="hover:text-primary hover:underline transition-colors">
                        {company.name}
                      </Link>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {job.locationType === "Remote" ? "Remote" : job.location} ({job.locationType})
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" /> {job.employmentType} • {job.experienceLevel} Level
                      </div>
                      {(job.salaryMin || job.salaryMax) && (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                          <DollarSign className="w-4 h-4" />
                          {job.salaryMin && `$${(job.salaryMin / 1000).toFixed(0)}k`} 
                          {job.salaryMin && job.salaryMax && " - "}
                          {job.salaryMax && `$${(job.salaryMax / 1000).toFixed(0)}k`}
                        </div>
                      )}
                    </div>
                    
                    {isOwner ? (
                      <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 bg-primary/10 text-primary hover:bg-primary/20" disabled>
                        <Briefcase className="w-5 h-5" /> You posted this job
                      </Button>
                    ) : (
                      <ApplyButton 
                        jobId={job._id!.toString()} 
                        jobTitle={job.title} 
                        hasApplied={alreadyApplied} 
                        applicationStatus={applicationStatus}
                        isLoggedIn={!!session?.user} 
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">About the Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Required Skills & Qualifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1 font-normal text-sm">{req}</Badge>
                    ))}
                  </div>
                </div>

                {job.targetPersona && (
                  <div>
                    <h3 className="font-semibold mb-2">Ideal Candidate</h3>
                    <p className="text-muted-foreground leading-relaxed italic">
                      "{job.targetPersona}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Match Analysis */}
          <div className="space-y-6">
            <Card className="border-border/50 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Target className="w-5 h-5" /> Alignment Score
                </CardTitle>
                <CardDescription>Intelligent Job Matching System</CardDescription>
              </CardHeader>
              <CardContent>
                {!session ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">Sign in to see how well you match this role.</p>
                    <Button variant="default" asChild className="w-full">
                      <Link href="/auth/sign-in">Sign In</Link>
                    </Button>
                  </div>
                ) : !matchAnalysis ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">Complete your profile to unlock personalized match analysis.</p>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/profile/${currentUsername}`}>Update Profile</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Match Percentage</span>
                      <span className={`text-2xl font-bold ${matchAnalysis.score >= 80 ? 'text-green-600' : matchAnalysis.score >= 50 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {matchAnalysis.score}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${matchAnalysis.score >= 80 ? 'bg-green-500' : matchAnalysis.score >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`} 
                        style={{ width: `${matchAnalysis.score}%` }} 
                      />
                    </div>

                    <div className="space-y-4">
                      {matchAnalysis.strengths.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-green-700">
                            <CheckCircle2 className="w-4 h-4" /> Your Strengths
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {matchAnalysis.strengths.map((s, i) => (
                              <span key={i} className="text-xs bg-green-500/10 text-green-700 px-2 py-1 rounded-md border border-green-500/20">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {matchAnalysis.gaps.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-orange-700">
                            <XCircle className="w-4 h-4" /> Skill Gaps
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {matchAnalysis.gaps.map((g, i) => (
                              <span key={i} className="text-xs bg-orange-500/10 text-orange-700 px-2 py-1 rounded-md border border-orange-500/20">{g}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <h4 className="text-sm font-semibold mb-3">Improvement Roadmap</h4>
                      <ul className="space-y-3">
                        {matchAnalysis.roadmap.map((step, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2 items-start">
                            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="leading-tight">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">About {company.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-4 mb-4">
                  {company.description || `Welcome to the official page for ${company.name}. We are operating in the ${company.industry} space with a team of ${company.size} professionals based in ${company.location}.`}
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/company/${company._id}`}>View Company Profile</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
