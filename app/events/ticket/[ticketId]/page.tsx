import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRegistrationByTicketId, getEventById } from "@/lib/db/events";
import { getCompanyById } from "@/lib/db/company";
import QRCode from "qrcode";
import TicketClient from "./ticket-client";

export default async function TicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  
  const registration = await getRegistrationByTicketId(ticketId);
  if (!registration) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.id !== registration.userId) {
    redirect("/auth/sign-in");
  }

  const event = await getEventById(registration.eventId);
  if (!event) notFound();

  const company = await getCompanyById(event.companyId);
  
  // Generate QR Code as Data URI
  const qrCodeDataUrl = await QRCode.toDataURL(ticketId, {
    width: 250,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 flex justify-center">
      <TicketClient 
        ticketId={ticketId}
        qrCodeUrl={qrCodeDataUrl}
        eventTitle={event.title}
        eventDate={new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        eventLocation={event.locationType === "Virtual" ? "Virtual Event" : event.location}
        organizerName={company?.name || "Organizer"}
        userName={session.user.name || "Attendee"}
      />
    </div>
  );
}
