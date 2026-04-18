"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Image as ImageIcon, MapPin, DollarSign, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function EventForm({ companyId, companyName }: { companyId: string, companyName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    date: "",
    time: "",
    locationType: "In-Person",
    location: "",
    price: "",
    description: "",
    coverImageUrl: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const eventDate = new Date(`${formData.date}T${formData.time}`);
      
      const payload = {
        title: formData.title,
        category: formData.category,
        companyId,
        locationType: formData.locationType,
        location: formData.locationType === "Virtual" ? "Online" : formData.location,
        date: eventDate.toISOString(),
        price: Math.round(parseFloat(formData.price || "0") * 100), // convert to cents
        description: formData.description,
        coverImageUrl: formData.coverImageUrl
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      toast.success("Event created securely!");
      router.push("/events");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="w-8 h-8 text-primary" /> Host an Event
        </h1>
        <p className="text-muted-foreground mt-1">Organizing as <span className="font-semibold text-foreground">{companyName}</span></p>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4 rounded-lg flex gap-3 text-sm">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Trust Validation Active</p>
          <p>Because your organization is securely verified, this event will be published immediately. Payments will be held in our Escrow system and released to you upon successful event validation.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Provide clear details to attract attendees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title <span className="text-red-500">*</span></Label>
                <Input 
                  id="title" 
                  required 
                  placeholder="e.g. Future of AI Summit 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                <Select required value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Meetup">Networking Meetup</SelectItem>
                    <SelectItem value="Hackathon">Hackathon</SelectItem>
                    <SelectItem value="Webinar">Webinar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="date" 
                  type="date" 
                  required 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time <span className="text-red-500">*</span></Label>
                <Input 
                  id="time" 
                  type="time" 
                  required 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="locationType">Format <span className="text-red-500">*</span></Label>
                <Select required value={formData.locationType} onValueChange={(v) => setFormData({...formData, locationType: v})}>
                  <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                    <SelectItem value="Virtual">Virtual</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.locationType !== "Virtual" && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location Address <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="location" 
                      className="pl-9" 
                      required 
                      placeholder="e.g. Moscone Center, SF"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Ticket Price (USD) <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="price" 
                    type="number" 
                    min="0"
                    step="0.01"
                    className="pl-9" 
                    required 
                    placeholder="0.00 for free"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Set to 0 for free registration.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="coverImage" 
                    className="pl-9" 
                    placeholder="https://..."
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData({...formData, coverImageUrl: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Event Description <span className="text-red-500">*</span></Label>
              <Textarea 
                id="description" 
                required 
                className="min-h-[150px]"
                placeholder="What is this event about? Who should attend?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
                Publish Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
