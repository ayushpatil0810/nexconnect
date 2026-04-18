import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { getEventById, getRegistrationsByEvent } from "@/lib/db/events";
import { getUserWithProfile } from "@/lib/db/profile";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Users, Download, QrCode } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import EventStatusManager from "./event-status-manager";

export default async function AttendeesPage({ params }: { params: Promise<{ id: string, eventId: string }> }) {
  const { id, eventId } = await params;
  
  const company = await getCompanyById(id);
  if (!company) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user || session.user.id !== company.creatorId) {
    redirect(`/company/${id}`);
  }

  const event = await getEventById(eventId);
  if (!event || event.companyId !== company._id!.toString()) notFound();

  const registrations = await getRegistrationsByEvent(eventId);
  
  // Hydrate with user profiles
  const hydratedAttendees = await Promise.all(
    registrations.map(async (reg) => {
      const userProfile = await getUserWithProfile(reg.userId);
      return {
        ...reg,
        user: userProfile
      };
    })
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2 -ml-2">
            <Link href={`/company/${id}/events`}>
              <ChevronLeft className="w-4 h-4" /> Back to Events
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" /> Event Attendees
            </h1>
            <p className="text-muted-foreground mt-1">Viewing registrations for <span className="font-semibold text-foreground">{event.title}</span></p>
          </div>
          
          <div className="flex items-center gap-4">
            <EventStatusManager eventId={event._id!} currentStatus={event.status} />
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold border border-primary/20">
              Total Registrations: {registrations.length}
            </div>
          </div>
        </div>

        <Card className="border-border/50 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {hydratedAttendees.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">No attendees yet</h3>
                <p className="text-muted-foreground">When users purchase tickets, they will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Attendee Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registration Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hydratedAttendees.map((attendee) => (
                      <TableRow key={attendee._id}>
                        <TableCell className="font-medium">
                          {attendee.user?.name || "Unknown User"}
                        </TableCell>
                        <TableCell>
                          {attendee.user?.email || "No Email Provided"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <QrCode className="w-3 h-3 text-muted-foreground" />
                            {attendee.ticketId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            {attendee.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(attendee.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
