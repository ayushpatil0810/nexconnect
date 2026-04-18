"use client";

import { useState } from "react";
import { NexEvent, EventTrustLevel } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ChevronRight, Search, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function EventsBoard({ initialEvents }: { initialEvents: NexEvent[] }) {
  const [search, setSearch] = useState("");
  const [trustFilter, setTrustFilter] = useState<string>("ALL");

  const filteredEvents = initialEvents.filter((event) => {
    // Search filter
    const matchesSearch = !search || 
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.category.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase());

    // Trust filter
    const matchesTrust = trustFilter === "ALL" || event.trustLevel === trustFilter;

    return matchesSearch && matchesTrust;
  });

  const getTrustBadge = (level: EventTrustLevel) => {
    switch (level) {
      case EventTrustLevel.TRUSTED:
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"><ShieldCheck className="w-3 h-3" /> Trusted Event</Badge>;
      case EventTrustLevel.MODERATE:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1"><Shield className="w-3 h-3" /> Moderate Trust</Badge>;
      case EventTrustLevel.UNVERIFIED:
      default:
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1"><ShieldAlert className="w-3 h-3" /> Unverified Organizer</Badge>;
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" /> Events
          </h1>
          <p className="text-muted-foreground mt-1">Discover verified tech events, workshops, and meetups.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="w-full pl-9" 
              placeholder="Search events..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="flex h-10 w-full sm:w-[150px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={trustFilter}
            onChange={(e) => setTrustFilter(e.target.value)}
          >
            <option value="ALL">All Trust Levels</option>
            <option value={EventTrustLevel.TRUSTED}>Trusted Only</option>
            <option value={EventTrustLevel.MODERATE}>Moderate+</option>
          </select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="border-border/50 bg-muted/20 text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active events right now</h3>
            <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((event) => (
            <Card key={event._id} className="border-border/50 hover:bg-muted/10 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Link href={`/events/${event._id}`} className="text-xl font-semibold hover:text-primary transition-colors truncate">
                        {event.title}
                      </Link>
                      {getTrustBadge(event.trustLevel)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 shrink-0">
                        <MapPin className="w-4 h-4" /> {event.locationType === "Virtual" ? "Virtual" : event.location} ({event.locationType})
                      </span>
                      <span>•</span>
                      <span className="shrink-0 flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>•</span>
                      <span className="shrink-0">{event.category}</span>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0">
                    <div className="text-lg font-bold text-emerald-600">
                      {event.price === 0 ? "FREE" : `$${(event.price / 100).toFixed(2)}`}
                    </div>
                    <Button asChild>
                      <Link href={`/events/${event._id}`} className="gap-1">
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
