"use client";

import { useState } from "react";
import { Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Briefcase, MapPin, Loader2, Save, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface JobCreationFormProps {
  company: Company;
}

export default function JobCreationForm({ company }: JobCreationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [locationType, setLocationType] = useState("On-site");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [targetPersona, setTargetPersona] = useState("");

  const handleAddRequirement = () => {
    const trimmed = newRequirement.trim();
    if (trimmed && !requirements.includes(trimmed)) {
      setRequirements([...requirements, trimmed]);
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (req: string) => {
    setRequirements(requirements.filter((r) => r !== req));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || requirements.length === 0) {
      toast.error("Title, description, and at least one requirement are mandatory.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company._id,
          title,
          description,
          requirements,
          experienceLevel,
          employmentType,
          locationType,
          location: locationType !== "Remote" ? location : "Remote",
          salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
          salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
          targetPersona,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post job");
      }

      toast.success("Job posted successfully!");
      router.push(`/company/${company._id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-primary" /> Post a New Job
          </h1>
          <p className="text-muted-foreground mt-1">Creating a job posting for {company.name}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={`/company/${company._id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Publish Job
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>The core details that candidates will see first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title <span className="text-destructive">*</span></Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Developer" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entry">Entry Level</SelectItem>
                  <SelectItem value="Mid">Mid Level</SelectItem>
                  <SelectItem value="Senior">Senior Level</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Workplace Type</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="On-site">On-site</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {locationType !== "Remote" && (
            <div className="space-y-2">
              <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA" required={locationType !== "Remote"} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin">Minimum Salary (Optional)</Label>
              <Input id="salaryMin" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="e.g. 80000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMax">Maximum Salary (Optional)</Label>
              <Input id="salaryMax" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="e.g. 120000" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
          <CardDescription>Provide an in-depth overview of the role and its requirements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Job Description (Roles & Responsibilities) <span className="text-destructive">*</span></Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="What will this person be doing on a daily basis?"
              className="min-h-[150px]"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Required Skills & Qualifications <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input 
                value={newRequirement} 
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequirement())}
                placeholder="e.g. 3+ years React experience" 
              />
              <Button type="button" variant="secondary" onClick={handleAddRequirement}><Plus className="w-4 h-4" /></Button>
            </div>
            
            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-sm">
                    {req}
                    <button type="button" onClick={() => handleRemoveRequirement(req)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Target Candidate Profile (Ideal Persona)</Label>
            <Textarea 
              value={targetPersona} 
              onChange={(e) => setTargetPersona(e.target.value)} 
              placeholder="Describe the ideal candidate. (e.g. 'A self-starter who excels in fast-paced startup environments and is passionate about AI.')"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">This helps our Intelligent Matching System find the best candidates for you.</p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
