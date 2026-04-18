"use client";

import { useState } from "react";
import { Company, Job } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, Globe, MapPin, Users, ShieldAlert, ShieldCheck, Edit3, PlusCircle, Save, X, Loader2, Camera, Briefcase, ChevronRight, Calendar, Megaphone, FileText, Eye, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CompanyViewProps {
  company: Company;
  jobs: Job[];
  representatives: any[];
  isOwner: boolean;
  currentUserId?: string;
}

export default function CompanyView({ company: initialCompany, jobs, representatives, isOwner, currentUserId }: CompanyViewProps) {
  const [company, setCompany] = useState(initialCompany);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const router = useRouter();

  const handleClaimOwnership = async () => {
    setClaiming(true);
    try {
      const res = await fetch(`/api/company/${company._id}/claim`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit claim");
      }
      toast.success("Ownership claim submitted for review. Your verification is pending.");
      
      // Optimistic UI update
      setCompany(prev => ({ ...prev, verificationStatus: "PENDING" }));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setClaiming(false);
    }
  };

  // Edit states
  const [editName, setEditName] = useState(company.name);
  const [editDescription, setEditDescription] = useState(company.description || "");
  const [editIndustry, setEditIndustry] = useState(company.industry);
  const [editLocation, setEditLocation] = useState(company.location);
  const [editWebsite, setEditWebsite] = useState(company.website || "");
  const [editSize, setEditSize] = useState(company.size);
  const [newRepId, setNewRepId] = useState("");
  const [newRepRole, setNewRepRole] = useState("Representative");

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
    setNewRepId("");
    setEditMode(false);
  }

  async function handleAddRepresentative() {
    if (!newRepId.trim()) {
      toast.error("Please enter a valid User ID");
      return;
    }
    try {
      const res = await fetch(`/api/company/${company._id}/representatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newRepId, role: newRepRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add representative");
      }
      toast.success("Representative mapped successfully. Please refresh the page to see changes.");
      setNewRepId("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error adding representative");
    }
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in">
      {isOwner && (
        <div className="mb-6 bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-primary/5 px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Company Administration
              </h2>
            </div>
            <div className="flex gap-2">
              {!editMode ? (
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-2 h-8">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8">
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="h-8">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex overflow-x-auto p-2 gap-1 items-center hide-scrollbar bg-muted/20">
            {company.verificationLevel !== "STRONG" && !editMode && (
              <Button size="sm" asChild variant="destructive" className="gap-2 shrink-0 h-8">
                <Link href={`/company/create`}><ShieldAlert className="w-3.5 h-3.5"/> Verify Ownership</Link>
              </Button>
            )}
            
            {!editMode && company.verificationLevel === "STRONG" && (
              <>
                <Button size="sm" asChild variant="ghost" className="gap-2 shrink-0 h-8 font-medium text-muted-foreground hover:text-foreground">
                  <Link href={`/company/${company._id}/events/new`}>
                    <PlusCircle className="w-3.5 h-3.5" /> Host Event
                  </Link>
                </Button>
                <Button size="sm" asChild variant="ghost" className="gap-2 shrink-0 h-8 font-medium text-muted-foreground hover:text-foreground">
                  <Link href={`/company/${company._id}/opportunities/new`}>
                    <Globe className="w-3.5 h-3.5" /> Post Pitch
                  </Link>
                </Button>
                
                <div className="w-px h-4 bg-border/80 mx-1 shrink-0" />
                
                <Button size="sm" asChild variant="ghost" className="gap-2 shrink-0 h-8 font-medium text-muted-foreground hover:text-foreground">
                  <Link href={`/company/${company._id}/events`}>
                    <Calendar className="w-3.5 h-3.5" /> Events
                  </Link>
                </Button>
                <Button size="sm" asChild variant="ghost" className="gap-2 shrink-0 h-8 font-medium text-muted-foreground hover:text-foreground">
                  <Link href={`/company/${company._id}/promotions`}>
                    <Megaphone className="w-3.5 h-3.5" /> Promotions
                  </Link>
                </Button>
                <Button size="sm" asChild variant="ghost" className="gap-2 shrink-0 h-8 font-medium text-muted-foreground hover:text-foreground">
                  <Link href={`/company/${company._id}/proposals`}>
                    <FileText className="w-3.5 h-3.5" /> Pitch Proposals
                  </Link>
                </Button>
              </>
            )}
            {!editMode && (
              <Button size="sm" asChild variant="ghost" className="gap-2 shrink-0 h-8 font-medium text-muted-foreground hover:text-foreground">
                <Link href={`/company/${company._id}/recruitment`}>
                  <Users className="w-3.5 h-3.5" /> Applicants
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

              {/* Inline Analytics Layer */}
              {isOwner && !editMode && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-2">
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Eye className="w-4 h-4" /> <span className="text-xs font-medium">Profile Views</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {Math.floor(120 * ((company.trustScore || 10) / 10) * 1.5).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" /> <span className="text-xs font-medium">Engagement</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {Math.floor(Math.floor(120 * ((company.trustScore || 10) / 10) * 1.5) * 0.08).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <BarChart3 className="w-4 h-4" /> <span className="text-xs font-medium">Engagement Rate</span>
                    </div>
                    <p className="text-xl font-bold text-primary">8.0%</p>
                  </div>
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <ShieldCheck className="w-4 h-4" /> <span className="text-xs font-medium">Trust Score</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{company.trustScore || 0}/100</p>
                  </div>
                </div>
              )}

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

          <Card className="border-border/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Authorized Representatives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                The following individuals have been verified as official representatives of this organization. To ensure security, investment inquiries should only be directed to these verified members.
              </p>
              
              {editMode && (
                <div className="bg-muted/50 p-4 rounded-xl border border-border mb-4 space-y-3">
                  <h4 className="text-sm font-semibold">Map New Representative</h4>
                  <div className="flex gap-2 items-center">
                    <Input 
                      placeholder="User ID..." 
                      className="h-8 flex-1 text-xs" 
                      value={newRepId}
                      onChange={(e) => setNewRepId(e.target.value)}
                    />
                    <select 
                      className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                      value={newRepRole}
                      onChange={(e) => setNewRepRole(e.target.value)}
                    >
                      <option value="Representative">Representative</option>
                      <option value="Admin">Admin</option>
                      <option value="Owner">Owner</option>
                    </select>
                    <Button size="sm" onClick={handleAddRepresentative} className="h-8 px-3 whitespace-nowrap">
                      Map User
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    By mapping a user, you grant them authority to receive direct, secure investment inquiries on behalf of the company.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {representatives.map((rep, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-background shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                        {rep.user?.image ? (
                          <img src={rep.user.image} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                            {rep.user?.name?.[0] || "?"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{rep.user?.name || "Verified User"}</p>
                        <p className="text-xs text-muted-foreground">{rep.role}</p>
                      </div>
                    </div>
                    {currentUserId !== rep.userId && (
                      <div className="flex flex-col items-end gap-1">
                        {!company.hasVerifiedOwner && company.verificationStatus !== "VERIFIED" ? (
                          <div className="text-[10px] text-red-500 font-medium text-right max-w-[150px]">
                            Only verified organization representatives can perform this action
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/company/${company._id}/invest?repId=${rep.userId}`}>
                              Contact
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                <span className="text-4xl font-bold text-primary">{company.trustScore || 0}</span>
                <span className="text-muted-foreground mb-1">/ 100</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full rounded-full ${(company.trustScore || 0) >= 80 ? 'bg-green-500' : (company.trustScore || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                  style={{ width: `${company.trustScore || 0}%` }} 
                />
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Org Verification</span>
                  <span className={company.verificationLevel === "STRONG" ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
                    {company.verificationLevel}
                  </span>
                </div>
                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Ownership Identity</span>
                  {company.hasVerifiedOwner ? (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> VERIFIED
                    </span>
                  ) : company.verificationStatus === "PENDING" ? (
                    <span className="text-yellow-600 font-semibold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> PENDING
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> UNVERIFIED
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] leading-tight text-muted-foreground mb-4">
                This score indicates the platform's confidence in the authenticity of this organization and its representatives, minimizing investment risk.
              </p>
              {!company.hasVerifiedOwner && (
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleClaimOwnership} disabled={claiming}>
                  {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Claim Verified Ownership
                </Button>
              )}
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
