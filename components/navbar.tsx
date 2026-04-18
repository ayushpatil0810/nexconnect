"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Search, Bell, LogOut, Settings, User, Moon, Sun, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { NotificationBell } from "./notification-bell";

export function Navbar({ profileUsername }: { profileUsername?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out successfully");
    router.push("/auth/sign-in");
    router.refresh();
  }

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="bg-primary p-1.5 rounded-lg group-hover:scale-105 transition-transform">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm hidden sm:block">NexConnect</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xs relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search people, companies..."
            className="pl-9 h-8 text-sm bg-muted/50 border-transparent focus:border-border"
          />
        </div>

        <nav className="hidden md:flex items-center gap-6 ml-4 text-sm font-medium">
          <Link href="/jobs" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Briefcase className="w-4 h-4" /> Jobs
          </Link>
        </nav>

        <div className="flex items-center gap-1 ml-auto">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8"
              id="theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          )}

          {/* Notifications */}
          {session?.user && <NotificationBell />}

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 ml-1">
                <Avatar className="w-8 h-8 border-2 border-border hover:border-primary transition-colors">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="space-y-0.5">
                  <p className="font-semibold">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profileUsername && (
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${profileUsername}`} className="gap-2" id="nav-view-profile">
                    <User className="w-4 h-4" /> View Profile
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/jobs/applications" className="gap-2" id="nav-applications">
                  <Briefcase className="w-4 h-4" /> My Applications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="gap-2" id="nav-settings">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/company/create" className="gap-2" id="nav-create-company">
                  <Building2 className="w-4 h-4" /> Create Company
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive gap-2" id="nav-signout">
                <LogOut className="w-4 h-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
