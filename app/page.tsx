import Link from "next/link";
import { Briefcase, Users, Star, ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "NexConnect — Professional Networking Platform",
  description: "Connect with professionals worldwide. Showcase your experience, discover opportunities, and grow your career on NexConnect.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">NexConnect</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="gap-1.5">
              <Link href="/auth/sign-up">Get started <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-6 animate-fade-in gap-1.5">
            <Star className="w-3 h-3" /> The professional network for the modern age
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in leading-tight">
            Your career,{" "}
            <span className="text-primary">elevated.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Build your professional identity, connect with peers, and discover opportunities that match your ambitions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Button size="lg" asChild className="gap-2 h-12 px-8 text-base">
              <Link href="/auth/sign-up">
                Join NexConnect <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">10M+</div>
              <div>Professionals</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">500K+</div>
              <div>Companies</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">150+</div>
              <div>Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to grow professionally</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              NexConnect gives you the tools to build a compelling professional presence and connect with the right people.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Smart Networking",
                description: "Connect with professionals in your field, follow thought leaders, and expand your network meaningfully.",
              },
              {
                icon: Shield,
                title: "Secure Authentication",
                description: "Sign in with Google, GitHub, or email. Your data is protected with industry-standard security.",
              },
              {
                icon: Star,
                title: "Rich Profiles",
                description: "Showcase your experience, education, skills, and achievements on a beautiful, modern profile page.",
              },
              {
                icon: Zap,
                title: "Career Opportunities",
                description: "Discover jobs and projects that match your skills and career goals, all in one place.",
              },
              {
                icon: Globe,
                title: "Global Community",
                description: "Connect with professionals from 150+ countries and be part of a truly global network.",
              },
              {
                icon: Briefcase,
                title: "Professional Identity",
                description: "Build and own your professional story with a customizable profile that stands out.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-primary/10 rounded-3xl p-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to build your network?</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join millions of professionals on NexConnect. It&apos;s free to get started.
            </p>
            <Button size="lg" asChild className="gap-2 h-12 px-10 text-base">
              <Link href="/auth/sign-up">
                Create your profile <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">NexConnect</span>
            <span>© 2026</span>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
