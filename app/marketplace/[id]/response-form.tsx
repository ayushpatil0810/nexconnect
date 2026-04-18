"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ResponseForm({ opportunityId, companyName }: { opportunityId: string, companyName: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit response");
      }

      toast.success("Response sent successfully!");
      setSubmitted(true);
      setTimeout(() => setOpen(false), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center p-4 border border-emerald-500/20 rounded-lg bg-emerald-500/5">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <h4 className="font-bold text-emerald-700 mb-1">Proposal Submitted</h4>
        <p className="text-xs text-emerald-600/80">The authorized representatives of {companyName} have been notified.</p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Respond to Opportunity</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Proposal / Inquiry</DialogTitle>
          <DialogDescription>
            Your verified profile details will be shared securely with {companyName}'s authorized representatives.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Textarea 
              placeholder="Provide a brief overview of how you or your organization can fulfill this opportunity..."
              className="min-h-[150px] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <p className="text-[11px] text-muted-foreground leading-tight">
              NexConnect monitors B2B exchanges to prevent spam. Ensure your message is highly relevant.
            </p>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading || !message.trim()} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Secure Response
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
