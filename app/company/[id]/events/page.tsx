import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { getEventsByCompany } from "@/lib/db/events";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, ChevronRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function ManageEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const company = await getCompanyById(id);
  if (!company) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  
  // Security verification
  if (!session?.user || session.user.id !== company.creatorId) {
    redirect(`/company/${id}`);
  }

  const events = await getEventsByCompany(id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="w-8 h-8 text-primary" /> Event Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage events and attendees for {company.name}</p>
          </div>
          <Button asChild className="gap-2">
            <Link href={`/company/${id}/events/new`}>
              <PlusCircle className="w-4 h-4" /> Host New Event
            </Link>
          </Button>
        </div>

        {events.length === 0 ? (
          <Card className="border-border/50 bg-muted/20 text-center py-12">
            <CardContent>
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events created yet</h3>
              <p className="text-muted-foreground mb-6">Host your first event to start gathering attendees.</p>
              <Button asChild>
                <Link href={`/company/${id}/events/new`}>Create Event</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map((event) => (
              <Card key={event._id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">{event.title}</h2>
                        <Badge variant={event.status === "UPCOMING" ? "default" : "secondary"}>
                          {event.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {event.locationType === "Virtual" ? "Virtual" : event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                      <Button asChild variant="outline" className="gap-2">
                        <Link href={`/events/${event._id}`} target="_blank">
                           View Event Page
                        </Link>
                      </Button>
                      <Button asChild variant="default" className="gap-2">
                        <Link href={`/company/${id}/events/${event._id}/attendees`}>
                          <Users className="w-4 h-4" /> Manage Attendees
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
