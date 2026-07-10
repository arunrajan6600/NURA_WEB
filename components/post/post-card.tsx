"use client";

import { Post } from "@/types/post";
import { BlogPostCard } from "./blog-post-card";
import { ProjectPostCard } from "./project-post-card";
import { PaperPostCard } from "./paper-post-card";
import { ArticlePostCard } from "./article-post-card";

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
      return <PaperPostCard post={post} />;
    case "article":
      return <ArticlePostCard post={post} />;
    case "story":
      // Use ArticlePostCard for stories as they're similar content
      return <ArticlePostCard post={post} />;
    case "general":
      // Use BlogPostCard for general writings
      return <BlogPostCard post={post} />;
    default:
      // Fallback for unknown post types
      return <BlogPostCard post={post} />;
  }
}
