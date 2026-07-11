"use client";

import { Post } from "@/types/post";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";

interface LinkPostCardProps {
  post: Post;
  variant?: "default" | "compact";
}

function getPreviewContent(post: Post) {
  const markdownCell = post.cells.find((cell) => cell.type === "markdown");
  if (!markdownCell) return "";

  const content = markdownCell.content as string;
  const words = content.split(" ");
  return words.slice(0, 30).join(" ") + (words.length > 30 ? "..." : "");
}

// Extract URL from markdown content for external links
function extractUrl(post: Post): string | null {
  const markdownCell = post.cells.find((cell) => cell.type === "markdown");
  if (!markdownCell) return null;

  const content = markdownCell.content as string;
  const urlMatch = content.match(/https?:\/\/[^\s\)]+/);
  return urlMatch ? urlMatch[0] : null;
}

export function LinkPostCard({
  post,
  variant = "default",
}: LinkPostCardProps) {
  const formattedDate = formatDistance(new Date(post.updatedAt), new Date(), {
    addSuffix: true,
  });
  const previewContent = getPreviewContent(post);
  const isCompact = variant === "compact";
  const externalUrl = extractUrl(post);

  return (
    <div className="flex flex-col gap-3 border border-border bg-card/70 px-4 py-4 transition-colors hover:border-primary/70 hover:bg-card sm:gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-base font-medium uppercase leading-snug">
            {post.title}
          </h3>
          <p className="font-mono text-xs uppercase text-muted-foreground">
            {formattedDate}
          </p>
        </div>

        <div className="flex flex-col gap-1 flex-shrink-0">
          {externalUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                Visit link
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/post/${post.id}`}>
              View details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {!isCompact && previewContent && (
        <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
          {previewContent}
        </p>
      )}

      {externalUrl && (
        <p className="border-t border-border pt-3 font-mono text-xs text-muted-foreground truncate">
          <span className="uppercase">link:</span> {externalUrl}
        </p>
      )}
    </div>
  );
}
