"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Loader2, Send } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function CreatePost({ onPostCreated }: { onPostCreated?: () => void }) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const initials = session?.user?.name
    ?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  async function handleSubmit() {
    if (!content.trim()) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mediaUrl }),
      });
      
      if (!res.ok) throw new Error("Failed to post");
      
      setContent("");
      setMediaUrl("");
      setShowMediaInput(false);
      setIsExpanded(false);
      toast.success("Post created successfully!");
      if (onPostCreated) onPostCreated();
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-border/50 shadow-sm transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div 
              className={`rounded-2xl border border-border transition-all duration-300 ${isExpanded ? 'bg-background p-3 min-h-[120px]' : 'bg-muted/30 p-2 hover:bg-muted/50 cursor-text'}`}
              onClick={() => !isExpanded && setIsExpanded(true)}
            >
              {isExpanded ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What do you want to talk about?"
                  className="min-h-[80px] border-none focus-visible:ring-0 p-0 resize-none text-sm bg-transparent"
                  autoFocus
                />
              ) : (
                <p className="text-sm text-muted-foreground ml-2 line-clamp-1">Share a post, article, or update...</p>
              )}
            </div>

            {isExpanded && (
              <div className="animate-fade-in mt-2 space-y-3">
                {showMediaInput && (
                  <div className="flex items-center gap-2 px-2">
                    <Input 
                      placeholder="Paste image URL here..." 
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="h-8 text-xs bg-muted/50 border-border/50"
                      autoFocus
                    />
                    {mediaUrl && (
                      <div className="w-8 h-8 rounded shrink-0 overflow-hidden border border-border">
                        <img src={mediaUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = ''} />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`w-8 h-8 rounded-full transition-colors ${showMediaInput ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                      onClick={() => setShowMediaInput(!showMediaInput)}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setIsExpanded(false); setShowMediaInput(false); setMediaUrl(""); }} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button size="sm" className="gap-2 rounded-full px-4" onClick={handleSubmit} disabled={(!content.trim() && !mediaUrl) || isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
