"use client";

import { useState, useEffect } from "react";
import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FeedStream() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/posts?limit=20");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="space-y-4">
      <CreatePost onPostCreated={fetchPosts} />
      
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post._id} post={post} onUpdate={fetchPosts} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-xl border border-border border-dashed">
          <p className="text-muted-foreground text-sm">No posts yet. Be the first to share something!</p>
        </div>
      )}
    </div>
  );
}
