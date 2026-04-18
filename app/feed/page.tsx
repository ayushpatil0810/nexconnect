import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getProfileByUserId } from "@/lib/db/profile";
import { getCompaniesByCreator } from "@/lib/db/company";
import { getConnections } from "@/lib/db/connection";
import { FeedStream } from "@/components/feed-stream";
import { Recommendations } from "@/components/recommendations";
import { Invitations } from "@/components/invitations";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Briefcase, Users, TrendingUp, Edit3, Building2, ShieldAlert, ShieldCheck, Plus } from "lucide-react";

export default async function FeedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/sign-in");

  const profile = await getProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) redirect("/onboarding");

  const companies = await getCompaniesByCreator(session.user.id);
  const connections = await getConnections(session.user.id);

  const initials = session.user.name
    ?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <Navbar profileUsername={profile.username} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Profile card */}
          <aside className="lg:col-span-1 space-y-4">
            <Card className="border-border/50 overflow-hidden">
              {/* Mini banner */}
              <div className="h-16 profile-banner-gradient" />
              <CardContent className="px-4 pb-4">
                <div className="-mt-8 mb-3">
                  <Avatar className="w-16 h-16 border-4 border-card">
                    <AvatarImage src={profile.avatarUrl || session.user.image || ""} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="font-bold text-sm leading-tight">{session.user.name}</h2>
                {profile.headline && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{profile.headline}</p>
                )}
                {profile.country && (
                  <p className="text-xs text-muted-foreground mt-1">{profile.country}</p>
                )}
                <div className="mt-3 pt-3 border-t border-border/50">
                  <Button asChild variant="outline" size="sm" className="w-full gap-2 text-xs h-8">
                    <Link href={`/profile/${profile.username}`} id="feed-view-profile-btn">
                      <Edit3 className="w-3 h-3" /> View / Edit Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                {[
                  { icon: Users, label: "Connections", value: connections.length.toString() },
                  { icon: TrendingUp, label: "Profile views", value: "—" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <stat.icon className="w-4 h-4" />
                      {stat.label}
                    </div>
                    <span className="font-semibold text-primary">{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* My Companies */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">My Companies</h3>
                  <Button asChild variant="ghost" size="icon" className="w-6 h-6">
                    <Link href="/company/create">
                      <Plus className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                {companies.length > 0 ? (
                  <div className="space-y-3">
                    {companies.map((company) => (
                      <Link href={`/company/${company._id}`} key={company._id} className="flex items-start gap-2 group hover:bg-accent/50 p-2 -mx-2 rounded-lg transition-colors">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight truncate group-hover:text-primary transition-colors">
                            {company.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {company.verificationLevel === "STRONG" ? (
                              <Badge variant="outline" className="px-1 py-0 h-4 text-[10px] bg-green-500/10 text-green-600 border-green-500/20 gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> Verified
                              </Badge>
                            ) : company.verificationLevel === "WEAK" ? (
                              <Badge variant="outline" className="px-1 py-0 h-4 text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> Pending
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="px-1 py-0 h-4 text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-0.5">
                                <ShieldAlert className="w-2.5 h-2.5" /> Unverified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground mb-2">You haven't created any companies.</p>
                    <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                      <Link href="/company/create">Create Company</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main feed */}
          <div className="lg:col-span-2 space-y-4">
            <Invitations />
            <FeedStream />
          </div>

          {/* Right sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <Recommendations />
            
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">Complete your profile</h3>
                <div className="space-y-2">
                  {[
                    { label: "Add profile photo", done: !!profile.avatarUrl },
                    { label: "Add headline", done: !!profile.headline },
                    { label: "Add experience", done: profile.experience.length > 0 },
                    { label: "Add education", done: profile.education.length > 0 },
                    { label: "Add 5+ skills", done: profile.skills.length >= 5 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          item.done ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {item.done && (
                          <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="currentColor">
                            <path d="M8.5 2.5L4 7 1.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                      <span className={item.done ? "line-through text-muted-foreground" : "text-foreground"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">Trending topics</h3>
                <div className="flex flex-wrap gap-1.5">
                  {["#OpenToWork", "#Tech", "#AI", "#Leadership", "#Startup", "#Career"].map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
