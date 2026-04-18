"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EventStatusManager({ eventId, currentStatus }: { eventId: string, currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMarkCompleted = async () => {
    if (!confirm("Are you sure you want to mark this event as completed? This will open feedback forms for attendees.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" })
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      toast.success("Event marked as COMPLETED. Attendees can now leave feedback.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "COMPLETED") {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-sm gap-1.5">
        <CheckCircle2 className="w-4 h-4" /> Event Completed
      </Badge>
    );
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleMarkCompleted} 
      disabled={loading}
      className="gap-2 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-700 border-emerald-500/20"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
      Mark Event as Completed
    </Button>
  );
}
