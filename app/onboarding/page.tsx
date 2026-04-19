"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, User, MapPin, Loader2, ArrowRight, ArrowLeft, Check, Shield } from "lucide-react";
import FaceLivenessCheck from "@/components/face-liveness-check";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Basic Info", icon: User },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Professional", icon: Briefcase },
  { id: 4, label: "Verification", icon: Shield },
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "India", "Japan", "Brazil", "Mexico", "Singapore", "Other"
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRef = searchParams?.get("ref") || "";

  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);
  const [faceVerified, setFaceVerified] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
    country: "",
    headline: "",
    bio: "",
    referralCode: initialRef,
  });

  // Guard: if the user already completed onboarding, redirect to feed immediately
  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const profile = await res.json();
          if (profile?.onboardingComplete) {
            router.replace("/feed");
            return;
          }
        }
      } catch {
        // ignore — just show the onboarding form
      } finally {
        setChecking(false);
      }
    }
    checkOnboardingStatus();
  }, [router]);

  function update(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          onboardingComplete: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      toast.success("Profile created! Welcome to NexConnect 🎉");
      window.location.href = "/feed";
    } catch {
      toast.error("Failed to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  // Show a centered spinner while we verify onboarding status
  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">NexConnect</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Progress header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isComplete = step > s.id;
                const isCurrent = step === s.id;
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isComplete
                            ? "bg-primary text-primary-foreground"
                            : isCurrent
                            ? "bg-primary/10 border-2 border-primary text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-xs mt-1 font-medium ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 mb-5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: step > s.id ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-8">
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-bold">Welcome, {session?.user?.name?.split(" ")[0] || "there"}! 👋</h2>
                    <p className="text-muted-foreground mt-1">Let&apos;s start with your contact details</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="referralCode">Referral Code <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        id="referralCode"
                        placeholder="e.g. A1B2C3D"
                        value={formData.referralCode}
                        onChange={(e) => update("referralCode", e.target.value)}
                        className="h-11"
                        maxLength={20}
                      />
                      <p className="text-xs text-muted-foreground">If you were invited by someone, enter their code here.</p>
                    </div>
                  </div>

                  <Button className="w-full h-11 gap-2" onClick={() => setStep(2)} id="onboard-step1-next">
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-bold">Where are you based?</h2>
                    <p className="text-muted-foreground mt-1">Help others find and connect with you</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country / Region</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => update("country", c)}
                          className={`px-3 py-2 rounded-lg text-sm text-left transition-all border ${
                            formData.country === c
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-primary/50 hover:bg-accent"
                          }`}
                          id={`country-${c.replace(/\s/g, "-").toLowerCase()}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-11 gap-2" onClick={() => setStep(1)} id="onboard-step2-back">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button className="flex-1 h-11 gap-2" onClick={() => setStep(3)} id="onboard-step2-next">
                      Continue <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-bold">Your professional identity</h2>
                    <p className="text-muted-foreground mt-1">Tell the world what you do</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="headline">Professional headline</Label>
                      <Input
                        id="headline"
                        placeholder="e.g. Senior Software Engineer at Google"
                        value={formData.headline}
                        onChange={(e) => update("headline", e.target.value)}
                        className="h-11"
                        maxLength={120}
                      />
                      <p className="text-xs text-muted-foreground text-right">{formData.headline.length}/120</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">About you <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Textarea
                        id="bio"
                        placeholder="Share a brief summary of your experience, skills, and what you're looking for..."
                        value={formData.bio}
                        onChange={(e) => update("bio", e.target.value)}
                        className="resize-none"
                        rows={4}
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/2000</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-11 gap-2" onClick={() => setStep(2)} id="onboard-step3-back">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button className="flex-1 h-11 gap-2" onClick={() => setStep(4)} id="onboard-step3-next">
                      Continue <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 animate-fade-in">
                  {!faceVerified ? (
                    <FaceLivenessCheck onVerified={() => setFaceVerified(true)} />
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold">You&apos;re all set! 🎉</h2>
                        <p className="text-muted-foreground mt-1">Face verification complete — let&apos;s finish your profile</p>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-11 gap-2" onClick={() => { setFaceVerified(false); setStep(3); }} id="onboard-step4-back">
                          <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                        <Button
                          className="flex-1 h-11 gap-2"
                          onClick={handleComplete}
                          disabled={saving}
                          id="onboard-complete-btn"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          {saving ? "Saving..." : "Complete setup"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Step {step} of {STEPS.length} — You can always edit this later
          </p>
        </div>
      </div>
    </div>
  );
}
