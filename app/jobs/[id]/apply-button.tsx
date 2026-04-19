"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, FileText, Upload, X } from "lucide-react";

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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document (.pdf, .doc, .docx)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setResumeFile(file);
  };

  const removeResume = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // In production, you'd upload the file to cloud storage first.
      // For now we store the filename as a mock reference.
      const resumeUrl = resumeFile ? `uploads/resumes/${Date.now()}_${resumeFile.name}` : undefined;

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, coverLetter, resumeUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to apply");
      }

      toast.success("Application submitted successfully!");
      setOpen(false);
      setCoverLetter("");
      setResumeFile(null);
      router.refresh();
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Apply for {jobTitle}</DialogTitle>
            <DialogDescription>
              Your NexConnect profile, including skills and experience, will be automatically shared with the employer.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* Resume Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Resume
              </Label>

              {!resumeFile ? (
                <label
                  htmlFor="resume-upload"
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Click to upload resume
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PDF, DOC, or DOCX • Max 5MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resumeFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(resumeFile.size)} • Ready to upload
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeResume}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <Label htmlFor="coverLetter" className="text-sm font-medium">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                placeholder="Why are you a great fit for this role?"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="min-h-[130px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                A good cover letter increases your chances significantly.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
