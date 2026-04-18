"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function Invitations() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvites() {
      try {
        const res = await fetch("/api/connections/pending");
        if (res.ok) {
          const data = await res.json();
          setInvitations(data);
        }
      } catch (e) {
        console.error("Failed to fetch pending connections");
      } finally {
        setLoading(false);
      }
    }
    fetchInvites();
  }, []);

  async function handleAction(id: string, action: "ACCEPT" | "REJECT") {
    try {
      const res = await fetch(`/api/connections/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      
      if (!res.ok) throw new Error("Failed to process request");
      
      setInvitations(invitations.filter(inv => inv._id !== id));
      toast.success(action === "ACCEPT" ? "Connection accepted!" : "Connection ignored");
    } catch (e) {
      toast.error("Something went wrong");
    }
  }

  if (loading) return null;
  if (invitations.length === 0) return null;

  return (
    <Card className="border-border/50 mb-4 animate-scale-in">
      <CardHeader className="p-4 pb-2 border-b border-border/50 bg-primary/5">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>Invitations</span>
          <span className="bg-primary text-primary-foreground text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
            {invitations.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {invitations.map((inv) => {
            const profile = inv.requester;
            if (!profile) return null;
            const initials = profile.username?.substring(0, 2).toUpperCase() || "?";
            
            return (
              <div key={inv._id} className="p-4 flex gap-3 flex-col sm:flex-row sm:items-center">
                <div className="flex gap-3 flex-1 min-w-0">
                  <Link href={`/profile/${profile.username}`}>
                    <Avatar className="w-12 h-12 border border-border">
                      <AvatarImage src={profile.avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${profile.username}`} className="block">
                      <p className="text-sm font-semibold truncate hover:text-primary transition-colors">
                        {profile.name || profile.username}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                        {profile.headline || "Wants to connect with you"}
                      </p>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0 justify-end">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-8 h-8 rounded-full border-muted-foreground/30 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    onClick={() => handleAction(inv._id, "REJECT")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-8 h-8 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleAction(inv._id, "ACCEPT")}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
