"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function Recommendations() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch("/api/connections/recommendations?limit=3");
        if (res.ok) {
          const data = await res.json();
          setProfiles(data);
        }
      } catch (e) {
        console.error("Failed to fetch recommendations");
      } finally {
        setLoading(false);
      }
    }
    fetchRecs();
  }, []);

  async function handleConnect(userId: string) {
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId })
      });
      
      if (!res.ok) throw new Error("Failed to connect");
      
      setProfiles(profiles.filter(p => p.userId !== userId));
      toast.success("Connection request sent!");
    } catch (e) {
      toast.error("Failed to connect");
    }
  }

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (profiles.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Add to your feed</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        {profiles.map((profile) => {
          const initials = profile.username?.substring(0, 2).toUpperCase() || "?";
          return (
            <div key={profile.userId} className="flex gap-3">
              <Link href={`/profile/${profile.username}`}>
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={profile.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${profile.username}`} className="block">
                  <p className="text-sm font-semibold truncate hover:text-primary transition-colors">
                    {profile.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {profile.headline || "NexConnect Member"}
                  </p>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 h-7 px-3 text-xs rounded-full gap-1.5"
                  onClick={() => handleConnect(profile.userId)}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Connect
                </Button>
              </div>
            </div>
          );
        })}
        <Button variant="ghost" className="w-full text-xs text-muted-foreground mt-2">
          View all recommendations
        </Button>
      </CardContent>
    </Card>
  );
}
