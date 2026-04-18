"use client";

import { useState } from "react";
import { Profile, Education, Experience } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Edit3, MapPin, Globe, Phone, Briefcase, GraduationCap,
  Star, Plus, Trash2, Save, X, Loader2, Camera, Shield, BadgeCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrustBadge } from "@/components/trust-badge";
import { VerificationDashboard } from "@/components/verification-dashboard";

// Simple UUID replacement (no package needed)
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface ProfileViewProps {
  profile: Profile;
  isOwner: boolean;
  currentUser: { id: string; name: string; image?: string | null; email: string } | null;
}

export default function ProfileView({ profile: initialProfile, isOwner, currentUser }: ProfileViewProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editBio, setEditBio] = useState(profile.bio);
  const [editHeadline, setEditHeadline] = useState(profile.headline);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editCountry, setEditCountry] = useState(profile.country);
  const [editWebsite, setEditWebsite] = useState(profile.website);
  const [editSkills, setEditSkills] = useState<string[]>(profile.skills);
  const [newSkill, setNewSkill] = useState("");
  const [editEducation, setEditEducation] = useState<Education[]>(profile.education);
  const [editExperience, setEditExperience] = useState<Experience[]>(profile.experience);
  const [addingEdu, setAddingEdu] = useState(false);
  const [addingExp, setAddingExp] = useState(false);

  const [newEdu, setNewEdu] = useState<Partial<Education>>({});
  const [newExp, setNewExp] = useState<Partial<Experience>>({ current: false });

  const initials = (profile.userId && currentUser?.id === profile.userId ? currentUser?.name : profile.username)
    ?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${profile.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: editBio,
          headline: editHeadline,
          phone: editPhone,
          country: editCountry,
          website: editWebsite,
          skills: editSkills,
          education: editEducation,
          experience: editExperience,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      setProfile((prev) => ({
        ...prev,
        bio: editBio,
        headline: editHeadline,
        phone: editPhone,
        country: editCountry,
        website: editWebsite,
        skills: editSkills,
        education: editEducation,
        experience: editExperience,
      }));
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditBio(profile.bio);
    setEditHeadline(profile.headline);
    setEditPhone(profile.phone);
    setEditCountry(profile.country);
    setEditWebsite(profile.website);
    setEditSkills(profile.skills);
    setEditEducation(profile.education);
    setEditExperience(profile.experience);
    setEditMode(false);
    setAddingEdu(false);
    setAddingExp(false);
  }

  function addSkill() {
    const s = newSkill.trim();
    if (!s || editSkills.includes(s)) return;
    setEditSkills([...editSkills, s]);
    setNewSkill("");
  }

  function removeSkill(skill: string) {
    setEditSkills(editSkills.filter((s) => s !== skill));
  }

  function addEducation() {
    if (!newEdu.school || !newEdu.degree) {
      toast.error("School and degree are required");
      return;
    }
    setEditEducation([...editEducation, { id: genId(), ...newEdu } as Education]);
    setNewEdu({});
    setAddingEdu(false);
  }

  function removeEducation(id: string) {
    setEditEducation(editEducation.filter((e) => e.id !== id));
  }

  function addExperience() {
    if (!newExp.company || !newExp.title) {
      toast.error("Company and title are required");
      return;
    }
    setEditExperience([...editExperience, { id: genId(), ...newExp } as Experience]);
    setNewExp({ current: false });
    setAddingExp(false);
  }

  function removeExperience(id: string) {
    setEditExperience(editExperience.filter((e) => e.id !== id));
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      {/* Profile Header Card */}
      <Card className="border-border/50 overflow-hidden">
        {/* Banner */}
        <div className="h-36 sm:h-48 profile-banner-gradient relative">
          {isOwner && editMode && (
            <button className="absolute bottom-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        <CardContent className="px-6 pb-6">
          {/* Avatar + actions row */}
          <div className="flex items-end justify-between -mt-12 mb-4 flex-wrap gap-3">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-card ring-2 ring-primary/20">
                <AvatarImage src={profile.avatarUrl || currentUser?.image || ""} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isOwner && editMode && (
                <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full flex items-center justify-center transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isOwner && (
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="gap-2"
                      id="cancel-edit-btn"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-2"
                      id="save-profile-btn"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(true)}
                    className="gap-2"
                    id="edit-profile-btn"
                  >
                    <Edit3 className="w-4 h-4" /> Edit profile
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Name / headline */}
          {editMode ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Headline</Label>
                <Input
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="Your professional headline"
                  maxLength={120}
                  id="edit-headline-input"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+1 (555) 000-0000" id="edit-phone-input" />
                </div>
                <div className="space-y-1">
                  <Label>Country</Label>
                  <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} placeholder="United States" id="edit-country-input" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Website</Label>
                <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://yoursite.com" id="edit-website-input" />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {profile.username}
                  {profile.verificationStatus === "VERIFIED" && (
                    <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500/10" />
                  )}
                </h1>
                {!editMode && <TrustBadge status={profile.verificationStatus} trustScore={profile.trustScore} />}
              </div>
              {profile.headline && <p className="text-muted-foreground mt-1">{profile.headline}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {profile.country && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.country}</span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{profile.phone}</span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <Globe className="w-3.5 h-3.5" />{profile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="about">
        <TabsList className="w-full sm:w-auto flex-wrap h-auto">
          <TabsTrigger value="about" id="tab-about">About</TabsTrigger>
          <TabsTrigger value="experience" id="tab-experience">Experience</TabsTrigger>
          <TabsTrigger value="education" id="tab-education">Education</TabsTrigger>
          <TabsTrigger value="skills" id="tab-skills">Skills</TabsTrigger>
          {isOwner && <TabsTrigger value="verification" id="tab-verification" className="gap-1.5"><Shield className="w-3.5 h-3.5" /> Verification</TabsTrigger>}
        </TabsList>

        {/* About */}
        <TabsContent value="about" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <h2 className="font-semibold">About</h2>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Write a summary about yourself..."
                  className="resize-none"
                  rows={5}
                  maxLength={2000}
                  id="edit-bio-textarea"
                />
              ) : profile.bio ? (
                <p className="text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {isOwner ? "Add a bio to tell people about yourself." : "No bio added yet."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience */}
        <TabsContent value="experience" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <h2 className="font-semibold">Experience</h2>
              {isOwner && editMode && (
                <Button variant="ghost" size="sm" onClick={() => setAddingExp(true)} className="gap-1.5 text-primary" id="add-experience-btn">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add form */}
              {isOwner && editMode && addingExp && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border animate-scale-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Company *</Label>
                      <Input value={newExp.company || ""} onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} placeholder="Company name" id="new-exp-company" />
                    </div>
                    <div className="space-y-1">
                      <Label>Title *</Label>
                      <Input value={newExp.title || ""} onChange={(e) => setNewExp({ ...newExp, title: e.target.value })} placeholder="Job title" id="new-exp-title" />
                    </div>
                    <div className="space-y-1">
                      <Label>Location</Label>
                      <Input value={newExp.location || ""} onChange={(e) => setNewExp({ ...newExp, location: e.target.value })} placeholder="City, Country" id="new-exp-location" />
                    </div>
                    <div className="space-y-1">
                      <Label>Start Date</Label>
                      <Input type="month" value={newExp.startDate || ""} onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })} id="new-exp-start" />
                    </div>
                    {!newExp.current && (
                      <div className="space-y-1">
                        <Label>End Date</Label>
                        <Input type="month" value={newExp.endDate || ""} onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })} id="new-exp-end" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="exp-current"
                        checked={newExp.current || false}
                        onChange={(e) => setNewExp({ ...newExp, current: e.target.checked, endDate: "" })}
                        className="w-4 h-4 accent-primary"
                      />
                      <Label htmlFor="exp-current" className="cursor-pointer">Currently working here</Label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea value={newExp.description || ""} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} placeholder="Describe your role and achievements..." rows={3} className="resize-none" id="new-exp-description" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addExperience} className="gap-1.5" id="save-exp-btn"><Save className="w-3.5 h-3.5" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingExp(false); setNewExp({ current: false }); }} id="cancel-exp-btn"><X className="w-3.5 h-3.5" /> Cancel</Button>
                  </div>
                </div>
              )}

              {editExperience.length === 0 && !addingExp && (
                <p className="text-sm text-muted-foreground italic">
                  {isOwner && editMode ? "Click Add to add your work experience." : "No experience added yet."}
                </p>
              )}

              {editExperience.map((exp, i) => (
                <div key={exp.id}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{exp.title}</p>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                            {exp.location && ` · ${exp.location}`}
                          </p>
                        </div>
                        {isOwner && editMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-destructive hover:bg-destructive/10 flex-shrink-0"
                            onClick={() => removeExperience(exp.id)}
                            id={`remove-exp-${exp.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {exp.description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education */}
        <TabsContent value="education" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <h2 className="font-semibold">Education</h2>
              {isOwner && editMode && (
                <Button variant="ghost" size="sm" onClick={() => setAddingEdu(true)} className="gap-1.5 text-primary" id="add-education-btn">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwner && editMode && addingEdu && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border animate-scale-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>School *</Label>
                      <Input value={newEdu.school || ""} onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })} placeholder="University name" id="new-edu-school" />
                    </div>
                    <div className="space-y-1">
                      <Label>Degree *</Label>
                      <Input value={newEdu.degree || ""} onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="Bachelor's, Master's..." id="new-edu-degree" />
                    </div>
                    <div className="space-y-1">
                      <Label>Field of Study</Label>
                      <Input value={newEdu.field || ""} onChange={(e) => setNewEdu({ ...newEdu, field: e.target.value })} placeholder="Computer Science" id="new-edu-field" />
                    </div>
                    <div className="space-y-1">
                      <Label>Start Year</Label>
                      <Input value={newEdu.startYear || ""} onChange={(e) => setNewEdu({ ...newEdu, startYear: e.target.value })} placeholder="2018" id="new-edu-start" />
                    </div>
                    <div className="space-y-1">
                      <Label>End Year</Label>
                      <Input value={newEdu.endYear || ""} onChange={(e) => setNewEdu({ ...newEdu, endYear: e.target.value })} placeholder="2022" id="new-edu-end" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea value={newEdu.description || ""} onChange={(e) => setNewEdu({ ...newEdu, description: e.target.value })} placeholder="Activities, societies, achievements..." rows={2} className="resize-none" id="new-edu-description" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addEducation} className="gap-1.5" id="save-edu-btn"><Save className="w-3.5 h-3.5" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingEdu(false); setNewEdu({}); }} id="cancel-edu-btn"><X className="w-3.5 h-3.5" /> Cancel</Button>
                  </div>
                </div>
              )}

              {editEducation.length === 0 && !addingEdu && (
                <p className="text-sm text-muted-foreground italic">
                  {isOwner && editMode ? "Click Add to add your education." : "No education added yet."}
                </p>
              )}

              {editEducation.map((edu, i) => (
                <div key={edu.id}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{edu.school}</p>
                          <p className="text-sm text-muted-foreground">
                            {edu.degree}{edu.field ? `, ${edu.field}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {edu.startYear}{edu.endYear ? ` — ${edu.endYear}` : ""}
                          </p>
                        </div>
                        {isOwner && editMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-destructive hover:bg-destructive/10 flex-shrink-0"
                            onClick={() => removeEducation(edu.id)}
                            id={`remove-edu-${edu.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {edu.description && <p className="text-xs text-muted-foreground mt-2">{edu.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <h2 className="font-semibold">Skills</h2>
              {isOwner && !editMode && (
                <Button variant="ghost" size="sm" onClick={() => setEditMode(true)} className="gap-1.5 text-primary" id="edit-skills-shortcut">
                  <Edit3 className="w-4 h-4" /> Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwner && editMode && (
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g. React, Python...)"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    className="flex-1"
                    id="new-skill-input"
                  />
                  <Button size="sm" onClick={addSkill} variant="secondary" id="add-skill-btn">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {editSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  {isOwner && editMode ? "Add your skills above." : "No skills added yet."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="gap-1.5 pl-3 pr-2 py-1.5 text-sm"
                    >
                      <Star className="w-3 h-3 text-primary" />
                      {skill}
                      {isOwner && editMode && (
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                          id={`remove-skill-${skill}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Verification */}
        {isOwner && (
          <TabsContent value="verification" className="mt-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-1">Trust & Verification</h2>
              <p className="text-sm text-muted-foreground">Manage your identity verifications to unlock more features and increase your reach.</p>
            </div>
            <VerificationDashboard profile={profile} />
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}
