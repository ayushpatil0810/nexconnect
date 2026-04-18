"use client";

import { useState } from "react";
import { Company, Job } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, Globe, MapPin, Users, ShieldAlert, ShieldCheck, Edit3, PlusCircle, Save, X, Loader2, Camera, Briefcase, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CompanyViewProps {
  company: Company;
  jobs: Job[];
  isOwner: boolean;
}

export default function CompanyView({ company: initialCompany, jobs, isOwner }: CompanyViewProps) {
  const [company, setCompany] = useState(initialCompany);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Edit states
  const [editName, setEditName] = useState(company.name);
  const [editDescription, setEditDescription] = useState(company.description || "");
  const [editIndustry, setEditIndustry] = useState(company.industry);
  const [editLocation, setEditLocation] = useState(company.location);
  const [editWebsite, setEditWebsite] = useState(company.website || "");
  const [editSize, setEditSize] = useState(company.size);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/company/${company._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          industry: editIndustry,
          location: editLocation,
          website: editWebsite,
          size: editSize,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      setCompany((prev) => ({
        ...prev,
        name: editName,
        description: editDescription,
        industry: editIndustry,
        location: editLocation,
        website: editWebsite,
        size: editSize,
      }));
      setEditMode(false);
      toast.success("Company profile updated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditName(company.name);
    setEditDescription(company.description || "");
    setEditIndustry(company.industry);
    setEditLocation(company.location);
    setEditWebsite(company.website || "");
    setEditSize(company.size);
    setEditMode(false);
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in">
      {isOwner && (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Company Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">You are viewing this page as the owner.</p>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-2">
                <Edit3 className="w-4 h-4" /> Edit Details
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Save
                </Button>
              </div>
            )}
            {company.verificationLevel !== "STRONG" && !editMode && (
              <Button size="sm" asChild className="gap-2">
                <Link href={`/company/create`}>Verify Ownership</Link>
              </Button>
            )}
            {!editMode && (
              <Button size="sm" asChild variant="default" className="gap-2">
                <Link href={`/company/${company._id}/recruitment`}>
                  <Users className="w-4 h-4" /> Manage Applicants
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 overflow-hidden relative shadow-sm">
            <div className="h-32 bg-gradient-to-r from-primary/80 to-blue-600/80 relative">
              {isOwner && editMode && (
                <button className="absolute bottom-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <CardContent className="px-6 pb-6 relative">
              <div className="-mt-12 flex justify-between items-end mb-4">
                <div className="relative">
                  <div className="w-24 h-24 bg-card rounded-xl border-4 border-card flex items-center justify-center shadow-sm overflow-hidden">
                    {company.avatarUrl ? (
                      <img src={company.avatarUrl} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  {isOwner && editMode && (
                    <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full flex items-center justify-center transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {company.verificationLevel === "STRONG" ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 px-3 py-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Organization
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1.5 px-3 py-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Unverified
                    </Badge>
                  )}
                </div>
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label>Company Name</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Industry</Label>
                      <Input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Company Size</Label>
                      <Input value={editSize} onChange={(e) => setEditSize(e.target.value)} placeholder="e.g. 1-10, 50-200" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Location</Label>
                      <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. San Francisco, CA" />
                    </div>
                    <div className="space-y-1">
                      <Label>Website</Label>
                      <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-1">{company.name}</h1>
                  <p className="text-muted-foreground text-lg mb-4">{company.industry}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {company.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {company.location}
                      </div>
                    )}
                    {company.size && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> {company.size} employees
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4" />
                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">About</CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <Textarea 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                  placeholder="Describe your company's mission, vision, and what you do..."
                  className="min-h-[150px] resize-y"
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {company.description ? company.description : `Welcome to the official page for ${company.name}. We are operating in the ${company.industry} space with a team of ${company.size} professionals based in ${company.location}.`}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Trust Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">{company.trustScore}</span>
                <span className="text-muted-foreground mb-1">/ 100</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${company.trustScore >= 80 ? 'bg-green-500' : company.trustScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                  style={{ width: `${company.trustScore}%` }} 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                This score indicates the level of verification provided by the organization administrators.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Open Roles</CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm" className="gap-1 text-primary hover:bg-primary/10" onClick={() => router.push(`/company/${company._id}/jobs/new`)}>
                  <PlusCircle className="w-4 h-4" /> Post
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job._id} className="p-3 border border-border rounded-xl hover:bg-muted/50 transition-colors flex flex-col cursor-pointer" onClick={() => router.push(`/jobs/${job._id}`)}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-sm">{job.title}</h4>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <span>{job.employmentType}</span> • <span>{job.locationType}</span>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {job.requirements.slice(0, 2).map((req, i) => (
                          <span key={i} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full truncate max-w-[100px]">{req}</span>
                        ))}
                        {job.requirements.length > 2 && <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">+{job.requirements.length - 2}</span>}
                      </div>
                    </div>
                  ))}
                  {jobs.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                      <Link href={`/jobs?companyId=${company._id}`}>View all jobs</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">No open roles right now</p>
                  <p className="text-xs text-muted-foreground mb-4">Check back later or turn on job alerts.</p>
                  {isOwner && (
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => router.push(`/company/${company._id}/jobs/new`)}>
                      <PlusCircle className="w-4 h-4" /> Post a Job
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
