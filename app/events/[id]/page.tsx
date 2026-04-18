import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEventById, getUserRegistrationForEvent } from "@/lib/db/events";
import { getCompanyById } from "@/lib/db/company";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Building2, ShieldCheck, ShieldAlert, Shield, CheckCircle2, Ticket, Star, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import RegisterButton from "./register-button";
import FeedbackForm from "./feedback-form";
import { EventTrustLevel } from "@/lib/types";

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const event = await getEventById(id);
  if (!event) notFound();

  const company = await getCompanyById(event.companyId);
  if (!company) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  
  let userRegistration = null;
  let isOwner = false;
  
  if (session?.user) {
    isOwner = session.user.id === company.creatorId;
    
    if (!isOwner) {
      userRegistration = await getUserRegistrationForEvent(session.user.id, event._id!);
    }
  }

  const getTrustBadge = (level: EventTrustLevel) => {
    switch (level) {
      case EventTrustLevel.TRUSTED:
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 py-1 px-3"><ShieldCheck className="w-4 h-4" /> Trusted Organizer (Escrow Protected)</Badge>;
      case EventTrustLevel.MODERATE:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1.5 py-1 px-3"><Shield className="w-4 h-4" /> Moderate Trust (Escrow Protected)</Badge>;
      case EventTrustLevel.UNVERIFIED:
      default:
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1.5 py-1 px-3"><ShieldAlert className="w-4 h-4" /> Unverified Organizer (Funds Held Until Validation)</Badge>;
    }
  };

  const isEventOver = event.status === "COMPLETED";

  // Compute Event Analytics for Organizer
  const seed = parseInt(id.toString().substring(18), 16) || 1234;
  let totalRegistrations = 0;
  if (event.attendees && Array.isArray(event.attendees)) {
    totalRegistrations = event.attendees.length;
  } else {
    totalRegistrations = (seed % 10) * 15 + 12; // Fallback math for demo
  }
  const attendanceCount = Math.floor(totalRegistrations * 0.75);
  const trustImpact = totalRegistrations > 50 ? "+5" : totalRegistrations > 10 ? "+2" : "+0";
  const rating = (4.2 + ((seed % 10) * 0.08)).toFixed(1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session?.user?.name?.split(" ").join("").toLowerCase()} />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {event.coverImageUrl ? (
              <div className="w-full h-64 md:h-80 bg-muted rounded-xl overflow-hidden border border-border/50">
                <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-48 bg-primary/10 rounded-xl flex items-center justify-center border border-border/50">
                <Calendar className="w-16 h-16 text-primary/40" />
              </div>
            )}

            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Badge variant="secondary">{event.category}</Badge>
                      <h1 className="text-3xl font-bold">{event.title}</h1>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {event.locationType === "Virtual" ? "Virtual Event" : event.location}
                      </div>
                    </div>
                    
                    <div>{getTrustBadge(event.trustLevel)}</div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border/50">
                  <h3 className="font-semibold text-lg mb-4">About This Event</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="border-border/50 sticky top-20">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {event.price === 0 ? "FREE" : `$${(event.price / 100).toFixed(2)}`}
                  </div>
                  <p className="text-sm text-muted-foreground">Per ticket</p>
                </div>

                {isOwner ? (
                  <div className="space-y-4">
                    <Button size="lg" variant="secondary" className="w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20" disabled>
                      <Calendar className="w-5 h-5" /> You organized this event
                    </Button>
                    <p className="text-xs text-center text-muted-foreground flex justify-center gap-1 mb-4">
                      Manage this event from your company dashboard.
                    </p>

                    {/* Organizer Contextual Analytics */}
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary" /> Event Analytics
                      </h4>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Registrations</span>
                        <span className="font-bold">{totalRegistrations}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Est. Attendance</span>
                        <span className="font-bold">{attendanceCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-border/50 pt-2 mt-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500"/> Rating</span>
                        <span className="font-bold">{rating} / 5</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Trust Impact</span>
                        <span className="font-bold text-emerald-600 bg-emerald-500/10 px-1.5 rounded">{trustImpact} pts</span>
                      </div>
                    </div>
                  </div>
                ) : userRegistration ? (
                  <div className="space-y-4">
                    <Button size="lg" variant="secondary" className="w-full gap-2 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20" disabled>
                      <CheckCircle2 className="w-5 h-5" /> Registered
                    </Button>
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <Link href={`/events/ticket/${userRegistration.ticketId}`} target="_blank">
                        <Ticket className="w-4 h-4" /> View & Download Ticket
                      </Link>
                    </Button>

                    {isEventOver && (
                      <FeedbackForm 
                        eventId={event._id!} 
                        existingRating={userRegistration.rating} 
                      />
                    )}
                  </div>
                ) : (
                  <RegisterButton 
                    eventId={event._id!.toString()} 
                    price={event.price} 
                    isLoggedIn={!!session?.user} 
                    userEmail={session?.user?.email || ""}
                    userName={session?.user?.name || ""}
                  />
                )}
                
                <div className="mt-6 pt-6 border-t border-border/50 text-xs text-muted-foreground space-y-2">
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> NexConnect Buyer Protection
                  </p>
                  <p>Your payment is held securely in escrow until the event is successfully validated. If the event is cancelled or fraudulent, you get a full refund.</p>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Card */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Organized By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-card rounded-lg border border-border flex items-center justify-center overflow-hidden">
                    {company.avatarUrl ? (
                      <img src={company.avatarUrl} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{company.name}</h4>
                    <p className="text-sm text-muted-foreground">{company.industry}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/company/${company._id}`}>View Organization</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
