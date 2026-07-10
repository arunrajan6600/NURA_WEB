"use client";

import { Post } from "@/types/post";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <Card className="w-full transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10 hover:scale-[1.002] transform-gpu border-l-4 border-l-purple-500 dark:border-l-purple-400">
      <div className="block">
        <CardContent className="px-4 py-4 md:px-6 md:py-5 flex flex-col h-full min-h-[160px]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <LinkIcon className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  External Link
                </Badge>
              </div>
              <CardTitle className="transition-colors hover:text-primary text-lg font-bold leading-tight line-clamp-2">
                {post.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">
                {formattedDate}
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {externalUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="group font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  asChild
                >
                  <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                    Visit link{" "}
                    <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="group font-medium text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={`/post/${post.id}`}>
                  View details{" "}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>

          {!isCompact && previewContent && (
            <div className="mt-1">
              <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
                {previewContent}
              </p>
            </div>
          )}

          {externalUrl && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground truncate">
                <span className="font-medium">Link:</span> {externalUrl}
              </p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
