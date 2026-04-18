"use client";

import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TrustBadgeProps {
  status?: "PENDING" | "VERIFIED" | "RESTRICTED";
  trustScore?: number;
  className?: string;
}

export function TrustBadge({ status, trustScore = 0, className = "" }: TrustBadgeProps) {
  if (!status) return null;

  if (status === "VERIFIED") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full ${className}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Identity & Profession Verified (Score: {trustScore})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === "RESTRICTED") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full ${className}`}>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Restricted</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Account restricted due to low trust score or suspicious activity.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full ${className}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Unverified</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Basic user. Identity not fully verified. (Score: {trustScore})</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
