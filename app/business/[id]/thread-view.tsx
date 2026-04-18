"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ThreadView({ 
  discussionId, 
  initialMessages, 
  currentUserId,
  otherPartyName,
  otherPartyAvatar,
  status,
  isRepresentative
}: { 
  discussionId: string, 
  initialMessages: any[], 
  currentUserId: string,
  otherPartyName: string,
  otherPartyAvatar?: string,
  status: string,
  isRepresentative: boolean
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || status !== "ACTIVE") return;

    setSending(true);
    try {
      const res = await fetch(`/api/invest/${discussionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const savedMessage = await res.json();
      setMessages([...messages, savedMessage.message]);
      setNewMessage("");
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "ACTIVE" | "REJECTED") => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/invest/${discussionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update");
      toast.success(newStatus === "ACTIVE" ? "Discussion accepted" : "Discussion rejected");
      router.refresh();
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-muted/5">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={i} className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0 mt-1">
                  {otherPartyAvatar ? (
                    <img src={otherPartyAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                      {otherPartyName[0]}
                    </div>
                  )}
                </div>
              )}
              <div className={`rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border/50 shadow-sm rounded-tl-sm'}`}>
                <p className="whitespace-pre-line text-[15px]">{msg.content}</p>
                <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {status === "REQUESTED" && isRepresentative ? (
        <div className="p-4 border-t border-border/50 bg-card text-center space-y-3">
          <p className="text-sm font-medium">Accept this inquiry to open the communication channel.</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20" onClick={() => handleUpdateStatus("REJECTED")} disabled={updatingStatus}>
              <X className="w-4 h-4 mr-2" /> Decline
            </Button>
            <Button onClick={() => handleUpdateStatus("ACTIVE")} disabled={updatingStatus}>
              <Check className="w-4 h-4 mr-2" /> Accept & Reply
            </Button>
          </div>
        </div>
      ) : status === "REQUESTED" && !isRepresentative ? (
        <div className="p-4 border-t border-border/50 bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">Waiting for the representative to accept your request.</p>
        </div>
      ) : status === "REJECTED" ? (
        <div className="p-4 border-t border-border/50 bg-red-500/5 text-center">
          <p className="text-sm text-red-600 font-medium">This discussion was declined.</p>
        </div>
      ) : status === "CLOSED" ? (
        <div className="p-4 border-t border-border/50 bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">This discussion is closed.</p>
        </div>
      ) : (
        <div className="p-4 border-t border-border/50 bg-card">
          <form onSubmit={handleSend} className="flex gap-2">
            <Textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message securely..."
              className="min-h-[50px] resize-none py-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <Button type="submit" disabled={!newMessage.trim() || sending} className="h-auto shrink-0 w-12 sm:w-auto px-0 sm:px-6">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Send className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
