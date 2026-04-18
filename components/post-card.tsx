"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, MessageSquare, Share2, Send, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

function renderContentWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{part}</a>;
    }
    return part;
  });
}

export function PostCard({ post, onUpdate }: { post: any, onUpdate?: () => void }) {
  const { data: session } = useSession();
  const [reacted, setReacted] = useState(post.userReacted);
  const [likesCount, setLikesCount] = useState(post.reactions?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.previewComments || []);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [repostCommentary, setRepostCommentary] = useState("");
  const [isReposting, setIsReposting] = useState(false);

  useEffect(() => {
    setReacted(post.userReacted);
    setLikesCount(post.reactions?.length || 0);
  }, [post.userReacted, post.reactions]);

  const authorInitials = post.author?.name
    ?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  async function handleReact() {
    setReacted(!reacted);
    setLikesCount(reacted ? likesCount - 1 : likesCount + 1);

    try {
      await fetch(`/api/posts/${post._id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LIKE" }),
      });
    } catch (e) {
      toast.error("Failed to react");
      setReacted(reacted);
      setLikesCount(reacted ? likesCount : likesCount - 1);
    }
  }

  async function loadComments() {
    if (showComments) {
      setShowComments(false);
      return;
    }
    
    setShowComments(true);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (e) {
      toast.error("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      setComments([...comments, data]);
      setNewComment("");
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error("Failed to post comment");
    }
  }

  async function handleRepost() {
    setIsReposting(true);
    try {
      const originalId = post.isRepost ? post.originalPostId : post._id; // Reposting a repost just quotes the original
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: repostCommentary,
          isRepost: true,
          originalPostId: originalId
        }),
      });
      toast.success("Successfully shared!");
      setShowShareDialog(false);
      setRepostCommentary("");
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error("Failed to share post");
    } finally {
      setIsReposting(false);
    }
  }

  return (
    <Card className="border-border/50 overflow-hidden mb-4 animate-scale-in">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border border-border cursor-pointer">
              <AvatarImage src={post.author?.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/10 text-primary">{authorInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm leading-tight hover:text-primary cursor-pointer transition-colors">
                {post.author?.name || "Unknown User"}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                {post.author?.headline || "NexConnect Member"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {session?.user?.id === post.authorId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive">Delete Post</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {post.isRepost && (
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            <span>Reposted</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {post.content && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3">
            {renderContentWithLinks(post.content)}
          </p>
        )}
        
        {post.isRepost && post.originalPost ? (
          <div className="border border-border rounded-xl p-3 bg-muted/20 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-6 h-6 border border-border">
                <AvatarImage src={post.originalPost.author?.avatarUrl || ""} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {post.originalPost.author?.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold">{post.originalPost.author?.name || "Unknown User"}</span>
              <span className="text-[10px] text-muted-foreground">
                • {formatDistanceToNow(new Date(post.originalPost.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {renderContentWithLinks(post.originalPost.content)}
            </p>
            {post.originalPost.mediaUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border">
                <img src={post.originalPost.mediaUrl} alt="Original post attachment" className="w-full h-auto object-cover max-h-[300px]" />
              </div>
            )}
          </div>
        ) : post.mediaUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-border">
            <img src={post.mediaUrl} alt="Post attachment" className="w-full h-auto object-cover max-h-[400px]" />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2 border-t border-border/50 flex flex-col items-stretch">
        <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground border-b border-border/30 pb-2 mb-2">
          <span>{likesCount > 0 ? `${likesCount} reactions` : ""}</span>
          <span>{post.commentsCount > 0 ? `${post.commentsCount} comments` : ""}</span>
        </div>
        
        <div className="flex items-center justify-around w-full">
          <Button 
            variant="ghost" 
            className={`flex-1 gap-2 rounded-lg transition-all ${reacted ? 'text-primary bg-primary/5 hover:bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={handleReact}
          >
            <ThumbsUp className={`w-4 h-4 ${reacted ? 'fill-primary' : ''}`} />
            <span>Like</span>
          </Button>
          <Button variant="ghost" className="flex-1 gap-2 rounded-lg text-muted-foreground hover:text-foreground" onClick={loadComments}>
            <MessageSquare className="w-4 h-4" />
            <span>Comment</span>
          </Button>
          <Button variant="ghost" className="flex-1 gap-2 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setShowShareDialog(true)}>
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 px-2 space-y-4 animate-fade-in">
            {loadingComments ? (
              <p className="text-xs text-muted-foreground text-center py-2">Loading comments...</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment: any) => (
                  <div key={comment._id} className="flex gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author?.avatarUrl || ""} />
                      <AvatarFallback className="text-[10px]">{comment.author?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted/50 rounded-lg p-3 text-sm border border-border/50">
                        <p className="font-semibold text-xs mb-1">{comment.author?.name}</p>
                        <p>{comment.content}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-2 mt-1">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleAddComment} className="flex gap-2 items-center mt-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>{session?.user?.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Input 
                  placeholder="Add a comment..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="rounded-full pr-10 bg-muted/30"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                  disabled={!newComment.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardFooter>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share this post</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add your thoughts... (optional)"
              className="resize-none min-h-[100px] mb-4"
              value={repostCommentary}
              onChange={(e) => setRepostCommentary(e.target.value)}
            />
            <div className="border border-border rounded-xl p-3 bg-muted/20 opacity-70 cursor-not-allowed">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-6 h-6 border border-border">
                  <AvatarImage src={post.author?.avatarUrl || ""} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{authorInitials}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold">{post.author?.name || "Unknown User"}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed line-clamp-2">
                {post.content || (post.originalPost && post.originalPost.content)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)} disabled={isReposting}>Cancel</Button>
            <Button onClick={handleRepost} disabled={isReposting}>
              {isReposting ? "Sharing..." : "Share"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
