"use client";

import { useEffect, useState, useRef } from "react";
import { Post } from "@/types/post";
import { postsApi } from "@/lib/posts-api";
import { PostCard } from "./post-card";

interface LivePostsListProps {
  staticPosts: Post[];
  postTypes: string[];
  emptyMessage?: string;
}

export function LivePostsList({
  staticPosts,
  postTypes,
  emptyMessage = "No posts yet.",
}: LivePostsListProps) {
  const [livePosts, setLivePosts] = useState<Post[]>(staticPosts);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    postsApi
      .listPosts({ status: "published" })
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLivePosts(res.data as Post[]);
        }
      })
      .catch((err) => {
        console.error("Failed to load live posts list:", err);
      });
  }, []);

  const filteredPosts = livePosts.filter(
    (post) => post.status === "published" && postTypes.includes(post.type)
  );

  return (
    <div className="grid gap-3">
      {filteredPosts.length > 0 ? (
        filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} variant="compact" />
        ))
      ) : (
        <p className="empty-note text-center py-8 text-sm text-muted-foreground italic">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}
