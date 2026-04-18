"use client";

import { useState } from "react";
import { Job } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function JobBoard({ initialJobs }: { initialJobs: Job[] }) {
  const [search, setSearch] = useState("");

  const filteredJobs = initialJobs.filter((job) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.employmentType.toLowerCase().includes(query) ||
      job.locationType.toLowerCase().includes(query) ||
      (job.location && job.location.toLowerCase().includes(query)) ||
      job.requirements.some(r => r.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-primary" /> Job Board
          </h1>
          <p className="text-muted-foreground mt-1">Discover your next opportunity from verified companies.</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="w-full md:w-[300px] pl-9" 
            placeholder="Search roles, skills, or locations..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <Card className="border-border/50 bg-muted/20 text-center py-12">
          <CardContent>
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active jobs right now</h3>
            <p className="text-muted-foreground">Check back soon or try adjusting your search terms.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => (
            <Card key={job._id} className="border-border/50 hover:bg-muted/10 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/jobs/${job._id}`} className="text-xl font-semibold hover:text-primary transition-colors truncate">
                        {job.title}
                      </Link>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 shrink-0">
                        <MapPin className="w-4 h-4" /> {job.locationType === "Remote" ? "Remote" : job.location} ({job.locationType})
                      </span>
                      <span>•</span>
                      <span className="shrink-0">{job.employmentType}</span>
                      <span>•</span>
                      <span className="shrink-0">{job.experienceLevel} Level</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.requirements.slice(0, 5).map((req, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal px-2 truncate max-w-[120px]">{req}</Badge>
                      ))}
                      {job.requirements.length > 5 && (
                        <Badge variant="outline" className="text-xs font-normal">+{job.requirements.length - 5} more</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0">
                    {(job.salaryMin || job.salaryMax) && (
                      <div className="text-sm font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                        {job.salaryMin && `$${(job.salaryMin / 1000).toFixed(0)}k`} 
                        {job.salaryMin && job.salaryMax && " - "}
                        {job.salaryMax && `$${(job.salaryMax / 1000).toFixed(0)}k`}
                      </div>
                    )}
                    <Button asChild>
                      <Link href={`/jobs/${job._id}`} className="gap-1">
                        View Details <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
