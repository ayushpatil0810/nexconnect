"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Globe, Plus, X } from "lucide-react";
import Link from "next/link";
import { OpportunityType } from "@/lib/types";

export default function OpportunityForm({ companyId, companyName }: { companyId: string, companyName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<OpportunityType>("PARTNERSHIP");
  const [budget, setBudget] = useState("");
  
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentReq, setCurrentReq] = useState("");

  const handleAddReq = () => {
    if (currentReq.trim() && !requirements.includes(currentReq.trim())) {
      setRequirements([...requirements, currentReq.trim()]);
      setCurrentReq("");
    }
  };

  const handleRemoveReq = (req: string) => {
    setRequirements(requirements.filter(r => r !== req));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          title,
          description,
          type,
          budget: budget.trim() || undefined,
          requirements
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post opportunity");
      }

      toast.success("Opportunity published to the Marketplace!");
      router.push(`/company/${companyId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create opportunity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link href={`/company/${companyId}`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Globe className="w-8 h-8 text-primary" /> Post a B2B Opportunity
        </h1>
        <p className="text-muted-foreground">
          Broadcast a strategic request on behalf of {companyName} directly to the verified NexConnect network.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Opportunity Details</CardTitle>
          <CardDescription>All listings undergo automated security validation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Opportunity Title <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="e.g. Seeking Strategic Distribution Partner in Europe" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Opportunity Type <span className="text-red-500">*</span></Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={type}
                  onChange={(e) => setType(e.target.value as OpportunityType)}
                >
                  <option value="PARTNERSHIP">Strategic Partnership</option>
                  <option value="FUNDING">Seeking Funding / Investment</option>
                  <option value="ACQUISITION">M&A / Acquisition</option>
                  <option value="SERVICE_REQUEST">Service Request (B2B)</option>
                  <option value="SERVICE_OFFERING">Service Offering</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Estimated Value / Budget (Optional)</Label>
                <Input 
                  placeholder="e.g. $50k - $200k, Equity 5%, Negotiable" 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Detailed Description <span className="text-red-500">*</span></Label>
              <Textarea 
                placeholder="Explain the opportunity, goals, and what you are looking for..." 
                className="min-h-[150px] resize-y" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-3">
              <Label>Key Requirements (Optional)</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Must have SOC2 Compliance" 
                  value={currentReq} 
                  onChange={(e) => setCurrentReq(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddReq();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddReq} className="shrink-0 gap-2">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
              {requirements.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-muted text-foreground text-sm px-3 py-1.5 rounded-md">
                      <span>{req}</span>
                      <button type="button" onClick={() => handleRemoveReq(req)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Publish to Marketplace
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
