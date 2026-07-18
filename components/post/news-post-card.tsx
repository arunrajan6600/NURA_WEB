"use client";

import { Post } from "@/types/post";
import { ThumbnailCell } from "./thumbnail-cell";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface NewsPostCardProps {
  post: Post;
  variant?: "default" | "compact";
}

function getPreviewContent(post: Post) {
  const markdownCell = post.cells.find((cell) => cell.type === "markdown");
  if (!markdownCell) return "";

  const content = markdownCell.content as string;
  const words = content.split(" ");
  return words.slice(0, 35).join(" ") + (words.length > 35 ? "..." : "");
}

export function NewsPostCard({
  post,
  variant = "default",
}: NewsPostCardProps) {
  const formattedDate = formatDistance(new Date(post.updatedAt), new Date(), {
    addSuffix: true,
  });
  const previewContent = getPreviewContent(post);
  const isCompact = variant === "compact";

  return (
    <div className="flex flex-col gap-3 border border-border bg-card/70 px-4 py-4 transition-colors hover:border-primary/70 hover:bg-card sm:gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-base font-medium uppercase leading-snug">
            {post.title}
          </h3>
          <p className="font-display text-xs uppercase text-muted-foreground">
            {formattedDate}
          </p>
        </div>
        <Link href={`/post/${post.id}`} className="flex-shrink-0">
          <Button variant="ghost" size="sm">
            Read more
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>

      {post.thumbnail && (
        <div className="flex-shrink-0">
          <ThumbnailCell
            content={post.thumbnail}
            className={isCompact ? "h-40" : "h-48 md:h-56"}
          />
        </div>
      )}

      {!isCompact && previewContent && (
        <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
          {previewContent}
        </p>
      )}
    </div>
  );
}
