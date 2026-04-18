"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ShieldAlert, ShieldCheck, UploadCloud, Briefcase, Mail, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

export default function CreateCompanyPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    location: "",
    size: "",
    creatorRole: "Owner",
  });

  const [verifyMethod, setVerifyMethod] = useState("email");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyDoc, setVerifyDoc] = useState("");
  const [verifying, setVerifying] = useState(false);

  function updateForm(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to create company");
      
      toast.success("Company created successfully! It is currently Unverified.");
      setCreatedCompanyId(data._id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!createdCompanyId) return;
    setVerifying(true);
    try {
      const payload = verifyMethod === "email" 
        ? { method: "email", email: verifyEmail }
        : { method: "document", documentUrl: verifyDoc || "mock-doc.pdf" };

      const res = await fetch(`/api/company/${createdCompanyId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Verification failed");
      
      toast.success(`Verification successful! Status: ${data.verificationLevel}`);
      router.push(`/feed`); // or company page
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setVerifying(false);
    }
  }

  if (isPending) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!session?.user) {
    router.push("/auth/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create a Company</h1>
              <p className="text-muted-foreground">Register your organization on NexConnect</p>
            </div>
          </div>
        </div>

        {!createdCompanyId ? (
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Provide basic information about the organization.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="Acme Corp" 
                    value={formData.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      placeholder="https://acme.com" 
                      value={formData.website}
                      onChange={(e) => updateForm("website", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input 
                      id="industry" 
                      placeholder="e.g. Technology, Finance..." 
                      value={formData.industry}
                      onChange={(e) => updateForm("industry", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Headquarters Location</Label>
                    <Input 
                      id="location" 
                      placeholder="City, Country" 
                      value={formData.location}
                      onChange={(e) => updateForm("location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Company Size</Label>
                    <Select value={formData.size} onValueChange={(v) => updateForm("size", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="500+">500+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Select value={formData.creatorRole} onValueChange={(v) => updateForm("creatorRole", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Founder">Founder</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Company Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-sm border-primary/20 animate-scale-in">
            <CardHeader className="bg-primary/5 pb-6 border-b border-border/50">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
                    <ShieldAlert className="w-3 h-3" /> Unverified Company
                  </Badge>
                  <CardTitle className="text-2xl">{formData.name}</CardTitle>
                  <CardDescription className="mt-1">
                    Your company profile is live but marked as unverified. 
                    Verify ownership to increase your Trust Score.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={verifyMethod} onValueChange={setVerifyMethod}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="email" className="gap-2"><Mail className="w-4 h-4"/> Domain Email</TabsTrigger>
                  <TabsTrigger value="document" className="gap-2"><UploadCloud className="w-4 h-4"/> Document</TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-primary" /> Strong Verification (Score: 90)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We'll verify that your email domain matches the company website ({formData.website || "No website provided"}).
                    </p>
                    <div className="space-y-2">
                      <Label>Work Email Address</Label>
                      <Input 
                        placeholder="you@company.com" 
                        value={verifyEmail}
                        onChange={(e) => setVerifyEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="document" className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <h3 className="font-medium text-sm flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4 text-primary" /> Weak Verification (Score: 40)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload an official business document (e.g., certificate of incorporation, tax document). This will be manually reviewed.
                    </p>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                      <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">Click to upload document</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                      <Input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => setVerifyDoc(e.target.value)} 
                        id="doc-upload"
                      />
                      <Button variant="secondary" size="sm" className="mt-4" onClick={() => document.getElementById('doc-upload')?.click()}>
                        Select File
                      </Button>
                      {verifyDoc && <p className="text-xs text-primary mt-2">File selected</p>}
                    </div>
                  </div>
                </TabsContent>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
                  <Button variant="ghost" onClick={() => router.push('/feed')}>Skip for now</Button>
                  <Button onClick={handleVerify} disabled={verifying} className="gap-2">
                    {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Claim
                  </Button>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
