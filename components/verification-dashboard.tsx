"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, Mail, Briefcase, FileBadge, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerificationDashboard({ profile }: { profile: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const trustScore = profile?.trustScore || 10; // Default base score for email
  const identityConfidence = profile?.identityConfidence || 20;

  // Work Email State
  const [workEmailOpen, setWorkEmailOpen] = useState(false);
  const [workEmail, setWorkEmail] = useState("");
  const [requestingLink, setRequestingLink] = useState(false);

  async function handleWorkEmailRequest() {
    if (!workEmail || !workEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setRequestingLink(true);
    try {
      const res = await fetch("/api/verify/work-email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: workEmail })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || "Magic link sent! Please check your inbox.");
        setWorkEmailOpen(false);
        setWorkEmail("");
      } else {
        toast.error(data.error || "Failed to send verification link");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setRequestingLink(false);
    }
  }

  async function handleVerifyAction(type: string) {
    setLoading(true);
    try {
      // In a real app, this would redirect to OAuth or an upload form
      // Here we simulate the API call that would happen after successful verification
      const res = await fetch("/api/verify/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      
      if (res.ok) {
        toast.success(`${type} verified successfully!`);
        router.refresh();
      } else {
        toast.error("Verification failed");
      }
    } catch (e) {
      toast.error("Error connecting to verification service");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Trust Score
            </CardTitle>
            <CardDescription>Your reputation within the NexConnect network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold">{trustScore}</span>
              <span className="text-sm text-muted-foreground mb-1">/ 100</span>
            </div>
            <Progress value={trustScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-3">
              {trustScore >= 80 ? "Excellent standing. All features unlocked." : 
               trustScore >= 50 ? "Good standing. Standard features available." : 
               "Low trust. Complete verifications to unlock features."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileBadge className="w-5 h-5 text-blue-500" />
              Identity Confidence
            </CardTitle>
            <CardDescription>Mathematical certainty of your real-world identity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold">{identityConfidence}%</span>
            </div>
            <Progress value={identityConfidence} className="h-2 bg-blue-100 dark:bg-blue-950" />
            <p className="text-xs text-muted-foreground mt-3">
              Higher confidence prevents impersonation and secures your brand.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Available Verifications</CardTitle>
          <CardDescription>Complete these to increase your Trust Score and Identity Confidence</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {/* Email - Always verified if they are logged in via Better Auth */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Email Address</h4>
                  <p className="text-xs text-muted-foreground">Base requirement for all users</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </div>
            </div>

            {/* Work Email */}
            <div className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Work Email {profile?.workEmail && <span className="text-xs text-muted-foreground ml-2 font-normal">({profile.workEmail})</span>}</h4>
                  <p className="text-xs text-muted-foreground">+20 Trust Score • +30 Confidence</p>
                </div>
              </div>
              {profile?.hasWorkEmail ? (
                <div className="flex items-center gap-1 text-primary text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setWorkEmailOpen(true)} disabled={loading}>
                  Verify <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Gov ID */}
            <div className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    Government ID 
                    <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">High Impact</span>
                  </h4>
                  <p className="text-xs text-muted-foreground">+40 Trust Score • +40 Confidence</p>
                </div>
              </div>
              {profile?.hasGovId ? (
                <div className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </div>
              ) : (
                <Button variant="default" size="sm" onClick={() => handleVerifyAction("GOV_ID")} disabled={loading}>
                  Upload ID <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Email Verification Dialog */}
      <Dialog open={workEmailOpen} onOpenChange={setWorkEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Work Email</DialogTitle>
            <DialogDescription>
              We'll send a secure magic link to your corporate email address to verify your employment domain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workEmail">Corporate Email Address</Label>
              <Input
                id="workEmail"
                placeholder="you@company.com"
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkEmailOpen(false)} disabled={requestingLink}>Cancel</Button>
            <Button onClick={handleWorkEmailRequest} disabled={requestingLink}>
              {requestingLink ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send Magic Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
