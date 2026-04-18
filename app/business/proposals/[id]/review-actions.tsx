"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReviewActions({ responseId }: { responseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ACCEPTED" | "REJECTED" | null>(null);

  const handleAction = async (status: "ACCEPTED" | "REJECTED") => {
    setLoading(status);
    try {
      const res = await fetch(`/api/opportunities/responses/${responseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Proposal ${status.toLowerCase()} successfully`);
      router.refresh();
    } catch (err) {
      toast.error("An error occurred");
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-4 pt-4 border-t border-border/50">
      <Button 
        variant="outline" 
        className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20" 
        onClick={() => handleAction("REJECTED")}
        disabled={loading !== null}
      >
        {loading === "REJECTED" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
        Decline
      </Button>
      <Button 
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => handleAction("ACCEPTED")}
        disabled={loading !== null}
      >
        {loading === "ACCEPTED" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
        Accept & Connect
      </Button>
    </div>
  );
}
