"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your work email...");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided in the URL.");
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch("/api/verify/work-email/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Your work email has been verified successfully! Your Trust Score has been increased.");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to verify token.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("A network error occurred. Please try again.");
      }
    }

    verifyToken();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {status === "loading" && <Loader2 className="w-12 h-12 animate-spin text-primary" />}
            {status === "success" && <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-scale-in" />}
            {status === "error" && <XCircle className="w-12 h-12 text-destructive animate-scale-in" />}
          </div>
          <CardTitle className="text-2xl">Work Email Verification</CardTitle>
          <CardDescription>Secure identity confirmation</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6 pt-2">
          <p className="text-muted-foreground">{message}</p>
          
          <div className="pt-4">
            {status === "loading" ? (
              <Button disabled className="w-full">Please wait...</Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/feed">Return to Dashboard</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkEmailVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
