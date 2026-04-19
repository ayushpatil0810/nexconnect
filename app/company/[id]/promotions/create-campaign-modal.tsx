"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, PlusCircle, Wallet, Link2, ExternalLink } from "lucide-react";

export default function CreateCampaignModal({ companyId, availableCredits }: { companyId: string, availableCredits: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    targetAudience: "",
    budget: 0,
    postUrl: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.budget <= 0) {
      toast.error("Budget must be greater than 0");
      return;
    }
    if (formData.budget > availableCredits) {
      toast.error("Insufficient promo credits. Redeem a coupon to add more.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/company/${companyId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`Campaign launched! ${formData.budget} credits deducted.`);
        setOpen(false);
        setFormData({ title: "", targetAudience: "", budget: 0, postUrl: "" });
        router.refresh();
      } else {
        toast.error(data.error || "Failed to launch campaign");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shrink-0 shadow-sm">
          <PlusCircle className="w-4 h-4" /> Create Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Launch Ad Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex justify-between items-center mb-4">
            <span className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> Available Credits
            </span>
            <span className="font-bold text-primary">{availableCredits.toLocaleString()}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title</Label>
            <Input
              id="title"
              placeholder="e.g. Q3 Investor Outreach"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postUrl">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Post / Content Link
              </span>
            </Label>
            <Input
              id="postUrl"
              placeholder="https://nexconnect.com/feed/post/... or any URL"
              value={formData.postUrl}
              onChange={(e) => setFormData({...formData, postUrl: e.target.value})}
            />
            <p className="text-xs text-muted-foreground">
              Paste the link to the post, article, or landing page you want to promote. This will be shown as sponsored content.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target Audience</Label>
            <Input
              id="target"
              placeholder="e.g. Series A Founders in FinTech"
              required
              value={formData.targetAudience}
              onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Credit Budget</Label>
            <Input
              id="budget"
              type="number"
              min={1}
              max={availableCredits}
              required
              value={formData.budget || ''}
              onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value) || 0})}
            />
            <p className="text-xs text-muted-foreground">Credits will be deducted immediately from your wallet.</p>
          </div>

          {/* Preview */}
          {formData.postUrl && (
            <div className="bg-muted/40 border border-border/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Promoted content</p>
                <p className="text-sm truncate">{formData.postUrl}</p>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading} className="gap-2 w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Launch Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
