"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

interface ApplyButtonProps {
  jobId: string;
  jobTitle: string;
  hasApplied: boolean;
  applicationStatus?: string | null;
  isLoggedIn: boolean;
}

export default function ApplyButton({ jobId, jobTitle, hasApplied, applicationStatus, isLoggedIn }: ApplyButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  if (hasApplied) {
    const statusText = applicationStatus 
      ? applicationStatus.replace('_', ' ') 
      : 'Applied';

    let iconColor = "text-emerald-600";
    if (applicationStatus === 'IN_REVIEW') iconColor = "text-yellow-600";
    if (applicationStatus === 'SHORTLISTED') iconColor = "text-purple-600";
    if (applicationStatus === 'REJECTED') iconColor = "text-red-600";
    if (applicationStatus === 'HIRED') iconColor = "text-green-600";

    return (
      <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 capitalize" disabled>
        <CheckCircle2 className={`w-5 h-5 ${iconColor}`} /> {statusText}
      </Button>
    );
  }

  const handleOpen = () => {
    if (!isLoggedIn) {
      router.push("/auth/sign-in");
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, coverLetter }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to apply");
      }

      toast.success("Application submitted successfully!");
      setOpen(false);
      router.refresh(); // Refresh page to show "Applied" state
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="lg" className="w-full sm:w-auto" onClick={handleOpen}>
        Easy Apply
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply for {jobTitle}</DialogTitle>
            <DialogDescription>
              Your NexConnect profile, including skills and experience, will be automatically shared with the employer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="coverLetter" className="mb-2 block text-sm font-medium">Cover Letter (Optional)</Label>
            <Textarea
              id="coverLetter"
              placeholder="Why are you a great fit for this role?"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
