"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Star, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FeedbackForm({ eventId, existingRating }: { eventId: string, existingRating?: number }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingRating);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/events/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, rating, feedback }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      toast.success("Thank you for your feedback!");
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5 mt-6">
        <CardContent className="p-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-emerald-700">Feedback Submitted</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your {existingRating || rating}-star rating helps keep our event ecosystem trustworthy!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 border-t border-border/50 pt-6">
      <h4 className="font-semibold text-sm mb-3 text-center">Rate your experience</h4>
      
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star 
              className={`w-8 h-8 transition-colors ${
                star <= (hoverRating || rating) 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-muted border-muted"
              }`} 
            />
          </button>
        ))}
      </div>

      <Textarea 
        placeholder="Share your thoughts about this event... (Optional)"
        className="min-h-[80px] text-sm resize-none mb-3"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />

      <Button 
        className="w-full gap-2" 
        onClick={handleSubmit} 
        disabled={loading || rating === 0}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit Feedback
      </Button>
    </div>
  );
}
