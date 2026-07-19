"use client";

import { Post } from "@/types/post";
import { BlogPostCard } from "./blog-post-card";
import { ProjectPostCard } from "./project-post-card";
import { PaperPostCard } from "./paper-post-card";

interface PostCardProps {
  post: Post;
  variant?: "default" | "compact";
}

export function PostCard({ post, variant = "default" }: PostCardProps) {
  // Route to the appropriate component based on post type
  switch (post.type) {
    case "blog":
      return <BlogPostCard post={post} />;
    case "project":
      return <ProjectPostCard post={post} variant={variant} />;
    case "paper":
    case "article": // legacy — article merged into paper
      return <PaperPostCard post={post} />;
    case "story":
    case "general":
      return <BlogPostCard post={post} />;
    default:
      // Custom content types fall back to blog card layout
      return <BlogPostCard post={post} />;
  }
}

