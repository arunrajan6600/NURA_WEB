"use client";

import { Post } from "@/types/post";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ThumbnailCell } from "./thumbnail-cell";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Newspaper, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <Card className="w-full transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10 hover:scale-[1.002] transform-gpu border-l-4 border-l-red-500 dark:border-l-red-400">
      <Link href={`/post/${post.id}`} className="block">
        <CardContent className="px-4 py-4 md:px-6 md:py-5 flex flex-col h-full min-h-[180px]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Newspaper className="h-4 w-4 text-red-500 dark:text-red-400" />
                <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                  News Report
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Breaking</span>
                </div>
              </div>
              <CardTitle className="transition-colors hover:text-primary text-lg font-bold leading-tight line-clamp-2">
                {post.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">
                {formattedDate}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="group font-medium flex-shrink-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Read news{" "}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {post.thumbnail && (
            <div className="mt-2 flex-shrink-0">
              <ThumbnailCell
                content={post.thumbnail}
                className={isCompact ? "h-40" : "h-48 md:h-56"}
              />
            </div>
          )}

          {!isCompact && previewContent && (
            <div className={post.thumbnail ? "mt-3" : "mt-1"}>
              <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
                {previewContent}
              </p>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
