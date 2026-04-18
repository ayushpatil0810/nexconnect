"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function InvestForm({ companyId, repId }: { companyId: string, repId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/invest/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, repId, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send request");
      }

      toast.success("Investment inquiry securely sent!");
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-2">
            <Send className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-emerald-700">Inquiry Delivered Securely</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            The authorized representative has been notified. They will review your profile verification status and respond directly through the platform.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/company/${companyId}`)}>
            Return to Company Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Initial Inquiry</CardTitle>
        <CardDescription>Provide a brief introduction of your investment thesis or interest.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea 
            placeholder="e.g. Hi, I represent an early-stage fund and we are very interested in your recent traction..."
            className="min-h-[150px] resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !message.trim()} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Secure Request
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
