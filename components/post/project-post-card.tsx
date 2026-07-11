"use client";

import { Post } from "@/types/post";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ThumbnailCell } from "./thumbnail-cell";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRef, useEffect, useMemo } from "react";

interface ProjectPostCardProps {
  post: Post;
  variant?: "default" | "compact";
}

function getPreviewContent(post: Post) {
  const markdownCell = post.cells.find((cell) => cell.type === "markdown");
  if (!markdownCell) return "";

  const content = markdownCell.content as string;
  const words = content.split(" ");
  return words.slice(0, 50).join(" ") + (words.length > 50 ? "..." : "");
}

function getWorkTags(post: Post) {
  const tags = new Set<string>();
  const text = [
    post.title,
    post.excerpt ?? "",
    ...post.cells.map((cell) =>
      typeof cell.content === "string" ? cell.content : JSON.stringify(cell.content)
    ),
  ]
    .join(" ")
    .toLowerCase();

  if (post.cells.some((cell) => cell.type === "video") || text.includes("video")) {
    tags.add("video");
  }
  if (post.thumbnail || post.cells.some((cell) => cell.type === "image")) {
    tags.add("image");
  }
  if (/\b(ai|yolo|model|embedding|chatgpt)\b/.test(text)) {
    tags.add("ai");
  }
  if (/\b(interactive|controlled|touchdesigner|vcv|api|sensor)\b/.test(text)) {
    tags.add("interactive");
  }
  if (/\b(code|python|shader|api)\b/.test(text)) {
    tags.add("code");
  }

  return Array.from(tags).slice(0, 5);
}

export function ProjectPostCard({
  post,
  variant = "default",
}: ProjectPostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);
  const isCompact = variant === "compact";

  const formattedDate = useMemo(
    () => formatDistance(new Date(post.updatedAt), new Date(), { addSuffix: true }),
    [post.updatedAt]
  );
  const previewContent = useMemo(() => getPreviewContent(post), [post]);
  const tags = useMemo(() => getWorkTags(post), [post]);

  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleMouseEnter = () => {
      if (isHovering.current) return;
      isHovering.current = true;

      window.dispatchEvent(
        new CustomEvent("cardHover", {
          detail: { type: "leave" },
        })
      );

      setTimeout(() => {
        const rect = cardElement.getBoundingClientRect();
        const scrollX =
          window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY =
          window.pageYOffset || document.documentElement.scrollTop;

        window.dispatchEvent(
          new CustomEvent("cardHover", {
            detail: {
              type: "enter",
              cardId: post.id,
              bounds: {
                left: rect.left + scrollX,
                top: rect.top + scrollY,
                right: rect.right + scrollX,
                bottom: rect.bottom + scrollY,
                width: rect.width,
                height: rect.height,
              },
            },
          })
        );
      }, 10);
    };

    const handleMouseLeave = () => {
      isHovering.current = false;
      window.dispatchEvent(
        new CustomEvent("cardHover", {
          detail: {
            type: "leave",
            cardId: post.id,
          },
        })
      );
    };

    const handleScroll = () => {
      if (!isHovering.current) return;

      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
        if (!isHovering.current) return;

        const rect = cardElement.getBoundingClientRect();
        const isInViewport =
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0;

        if (!isInViewport) {
          isHovering.current = false;
          window.dispatchEvent(
            new CustomEvent("cardHover", {
              detail: {
                type: "leave",
                cardId: post.id,
              },
            })
          );
        } else {
          const scrollX =
            window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY =
            window.pageYOffset || document.documentElement.scrollTop;

          window.dispatchEvent(
            new CustomEvent("cardHover", {
              detail: {
                type: "update",
                cardId: post.id,
                bounds: {
                  left: rect.left + scrollX,
                  top: rect.top + scrollY,
                  right: rect.right + scrollX,
                  bottom: rect.bottom + scrollY,
                  width: rect.width,
                  height: rect.height,
                },
              },
            })
          );
        }
      }, 16);
    };

    cardElement.addEventListener("mouseenter", handleMouseEnter);
    cardElement.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      if (isHovering.current) {
        window.dispatchEvent(
          new CustomEvent("cardHover", {
            detail: {
              type: "leave",
              cardId: post.id,
            },
          })
        );
      }
      cardElement.removeEventListener("mouseenter", handleMouseEnter);
      cardElement.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [post.id]);

  return (
    <Card
      ref={cardRef}
      className="w-full transition-all duration-300 hover:border-primary/70 hover:bg-card"
    >
      <Link href={`/post/${post.id}`} className="block">
        <CardContent className={`flex flex-col px-4 py-3 md:px-5 md:py-4 ${isCompact ? "" : "min-h-[200px]"}`}>
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl font-medium leading-tight transition-colors hover:text-primary">
                {post.title}
              </CardTitle>
              <p className="font-mono text-xs uppercase text-muted-foreground">
                {formattedDate}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="group font-medium flex-shrink-0"
            >
              Read more{" "}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-border px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {post.thumbnail && (
            <div className="mt-3 flex-shrink-0">
              <ThumbnailCell
                content={post.thumbnail}
                className={isCompact ? "h-48" : "h-64 md:h-72"}
              />
            </div>
          )}

          {!isCompact && previewContent && (
            <div className={post.thumbnail ? "mt-3" : "mt-1"}>
              <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                {previewContent}
              </p>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
