"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { postsApi } from "@/lib/posts-api";

const segmentLabels: Record<string, string> = {
  posts: "Posts",
  blog: "Blog",
  articles: "Articles & Papers",
  papers: "Articles & Papers",
  stories: "Stories",
  general: "Other Writings",
  info: "About",
  works: "Works",
  admin: "Admin",
  files: "Files",
  settings: "Settings",
  projects: "Projects",
  post: "Post",
};

// Segments we know are valid link targets
const LINKABLE_SEGMENTS = new Set([
  "posts",
  "blog",
  "articles",
  "papers",
  "stories",
  "general",
  "info",
  "works",
  "admin",
  "files",
  "settings",
  "projects",
]);

export function Breadcrumbs() {
  const pathname = usePathname() || "";
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);
  const [titleLoading, setTitleLoading] = useState(false);

  const segments = pathname.split("/").filter(Boolean);

  // Detect post-detail: path is /post/<id>
  const postIndex = segments.indexOf("post");
  const postId =
    postIndex !== -1 && postIndex < segments.length - 1
      ? segments[postIndex + 1]
      : null;

  useEffect(() => {
    if (!postId) {
      setDynamicTitle(null);
      return;
    }
    setTitleLoading(true);
    postsApi
      .getPost(postId)
      .then((res) => {
        if (res.success && res.data) {
          setDynamicTitle((res.data as any).title || null);
        }
      })
      .catch(() => {})
      .finally(() => setTitleLoading(false));
  }, [postId]);

  // Hide breadcrumbs on homepage
  if (pathname === "/") {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground"
    >
      <Link
        href="/"
        className="flex items-center gap-1 transition-colors hover:text-primary"
      >
        <Home className="h-3 w-3" />
        <span className="sr-only">Home</span>
      </Link>

      {segments.map((segment, index) => {
        const url = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;

        // This segment is a post ID (UUID following "post")
        const isPrevPost = index > 0 && segments[index - 1] === "post";
        const isUuid = segment.length > 10 && isPrevPost;

        let label: string;
        if (isUuid) {
          label = titleLoading ? "…" : dynamicTitle || segment;
        } else {
          label = segmentLabels[segment] || segment;
        }

        // Non-last segments: only linkify if it's a known navigable route
        const isLinkable = LINKABLE_SEGMENTS.has(segment) || isUuid;

        return (
          <div key={url} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45" />
            {isLast ? (
              <span className="text-foreground font-medium max-w-[200px] sm:max-w-[300px] truncate normal-case">
                {label}
              </span>
            ) : isLinkable ? (
              <Link href={url} className="transition-colors hover:text-primary">
                {label}
              </Link>
            ) : (
              <span>{label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
