"use client";

import { Post } from "@/types/post";
import { formatCardDate, formatDetailDate, hasBeenUpdated } from "@/lib/dates";

interface PostDatesProps {
  post: Post;
  className?: string;
}

/**
 * Renders Created and optionally Updated dates for collection cards.
 * Compact format: 19 Jul 2026
 */
export function PostCardDates({ post, className = "font-meta text-xs uppercase text-muted-foreground" }: PostDatesProps) {
  const isUpdated = hasBeenUpdated(post.createdAt, post.updatedAt);
  const createdStr = formatCardDate(post.createdAt);
  const updatedStr = formatCardDate(post.updatedAt);

  return (
    <div className="space-y-0.5">
      <p className={className} suppressHydrationWarning>
        Created • {createdStr}
      </p>
      {isUpdated && (
        <p className={className} suppressHydrationWarning>
          Updated • {updatedStr}
        </p>
      )}
    </div>
  );
}

/**
 * Renders Created and optionally Updated dates block inside the post detail page.
 * Detail format: 19 July 2026
 */
export function PostDetailDates({ post }: PostDatesProps) {
  const isUpdated = hasBeenUpdated(post.createdAt, post.updatedAt);
  const createdStr = formatDetailDate(post.createdAt);
  const updatedStr = formatDetailDate(post.updatedAt);

  return (
    <div className="mb-12 border-y border-border py-8 font-meta text-xs uppercase space-y-4">
      <div>
        <div className="text-muted-foreground">Created</div>
        <div className="text-foreground font-medium mt-1" suppressHydrationWarning>
          {createdStr}
        </div>
      </div>
      {isUpdated && (
        <div>
          <div className="text-muted-foreground">Updated</div>
          <div className="text-foreground font-medium mt-1" suppressHydrationWarning>
            {updatedStr}
          </div>
        </div>
      )}
    </div>
  );
}
