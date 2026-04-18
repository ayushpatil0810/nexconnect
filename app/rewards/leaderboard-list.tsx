"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Medal, Loader2, Trophy } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface LeaderboardUser {
  userId: string;
  username: string;
  avatarUrl: string;
  headline: string;
  verifiedReferralCount: number;
  rank: number;
}

export default function LeaderboardList() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard/referrals");
        if (res.ok) {
          const data = await res.json();
          setLeaders(data.leaderboard || []);
        }
      } catch (error) {
        console.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (leaders.length === 0) {
    return (
      <Card className="border-border/50 bg-muted/30 border-dashed">
        <CardContent className="p-8 text-center">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-muted-foreground">No leaders yet.</p>
          <p className="text-sm text-muted-foreground">Be the first to unlock a milestone!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {leaders.map((user) => (
        <Card key={user.userId} className={`border-border/50 transition-all hover:border-primary/40 ${user.rank <= 3 ? 'bg-primary/5 border-primary/20' : ''}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-8 flex justify-center font-bold text-lg">
              {user.rank === 1 ? <Medal className="w-6 h-6 text-yellow-500" /> : 
               user.rank === 2 ? <Medal className="w-6 h-6 text-gray-400" /> : 
               user.rank === 3 ? <Medal className="w-6 h-6 text-amber-700" /> : 
               <span className="text-muted-foreground">#{user.rank}</span>}
            </div>
            
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-muted border border-border/50">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                  {user.username?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${user.username}`} className="font-bold hover:underline truncate block">
                {user.username}
              </Link>
              <p className="text-xs text-muted-foreground truncate">{user.headline || "Professional Member"}</p>
            </div>
            
            <div className="text-right shrink-0">
              <Badge variant="secondary" className="font-bold text-sm bg-background border-border/50">
                {user.verifiedReferralCount} <span className="text-muted-foreground text-xs ml-1 font-normal">Verified</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
