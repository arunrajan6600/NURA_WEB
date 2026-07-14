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
  if (post.tags && post.tags.length > 0) {
    return post.tags;
  }
  if (post.projectMetadata?.technologies && post.projectMetadata.technologies.length > 0) {
    return post.projectMetadata.technologies;
  }

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
  const pm = post.projectMetadata;

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

  // Construct mono metadata string
  const metaString = useMemo(() => {
    const parts = [];
    if (pm?.year) parts.push(`year: ${pm.year}`);
    if (pm?.medium) parts.push(pm.medium);
    if (pm?.category) parts.push(pm.category);
    return parts.join(" · ");
  }, [pm]);

  return (
    <Card
      ref={cardRef}
      className="group w-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-md bg-card/40 hover:bg-card border border-border/50"
    >
      <Link href={`/post/${post.id}`} className="block" aria-label={`View project: ${post.title}`}>
        {/* Top Thumbnail Cover */}
        {post.thumbnail && (
          <div className="relative overflow-hidden aspect-video w-full border-b border-border/40 bg-muted/10">
            <ThumbnailCell
              content={post.thumbnail}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}

        <CardContent className="flex flex-col p-5 md:p-6 gap-3">
          {/* Metadata Row */}
          {metaString && (
            <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider">
              {metaString}
            </span>
          )}

          {/* Title and Featured Badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-xl md:text-2xl font-medium leading-snug transition-colors group-hover:text-primary">
                  {post.title}
                </CardTitle>
                {post.featured && (
                  <span className="border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono text-[9px] uppercase text-primary tracking-wider rounded-sm select-none">
                    featured
                  </span>
                )}
              </div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground/75">
                {formattedDate}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="group font-mono text-xs uppercase flex-shrink-0 gap-1.5 h-8 px-2 hover:bg-transparent hover:text-primary"
            >
              read
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Excerpt / Preview */}
          {!isCompact && previewContent && (
            <p className="text-muted-foreground/90 text-sm leading-relaxed line-clamp-3">
              {post.excerpt || previewContent}
            </p>
          )}

          {/* Technology / Tags chips */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-border/80 bg-muted/10 px-2 py-0.5 font-mono text-[9px] uppercase text-muted-foreground rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
