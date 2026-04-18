"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, MapPin, Calendar, User, Ticket } from "lucide-react";
import Link from "next/link";

interface TicketClientProps {
  ticketId: string;
  qrCodeUrl: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  organizerName: string;
  userName: string;
}

export default function TicketClient({ ticketId, qrCodeUrl, eventTitle, eventDate, eventLocation, organizerName, userName }: TicketClientProps) {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl w-full">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/events">
            <ChevronLeft className="w-4 h-4" /> Back to Events
          </Link>
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Download className="w-4 h-4" /> Save as PDF
        </Button>
      </div>

      <Card className="border-border/50 overflow-hidden shadow-xl bg-card">
        {/* Decorative Top */}
        <div className="h-4 w-full bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 20px)' }}></div>
        </div>
        
        <CardContent className="p-0 flex flex-col md:flex-row">
          {/* Main Info */}
          <div className="p-8 flex-1 border-b md:border-b-0 md:border-r border-dashed border-border">
            <div className="mb-8">
              <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Organized by {organizerName}</span>
              <h1 className="text-2xl font-bold mt-1 leading-tight">{eventTitle}</h1>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3 text-sm">
                <User className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Attendee Name</p>
                  <p className="font-medium">{userName}</p>
                </div>
              </div>
              
              <div className="flex gap-3 text-sm">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Date & Time</p>
                  <p className="font-medium">{eventDate}</p>
                </div>
              </div>

              <div className="flex gap-3 text-sm">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Location</p>
                  <p className="font-medium">{eventLocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-8 md:w-64 bg-muted/20 flex flex-col items-center justify-center relative">
            {/* Cutout circles for realism */}
            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-background hidden md:block"></div>
            <div className="absolute -left-3 -bottom-3 w-6 h-6 rounded-full bg-background hidden md:block"></div>
            
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4 text-center">Scan at Entrance</p>
            
            <div className="bg-white p-2 rounded-xl shadow-sm border mb-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ticket ID</p>
              <p className="font-mono font-bold tracking-widest">{ticketId.split('-').pop()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center text-xs text-muted-foreground mt-6 print:hidden">
        A copy of this ticket has been sent to your registered email address.
      </p>
    </div>
  );
}
