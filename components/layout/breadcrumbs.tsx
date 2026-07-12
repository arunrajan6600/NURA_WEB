"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { posts } from "@/data/posts";

const segmentLabels: Record<string, string> = {
  posts: "Posts",
  blog: "Blog",
  papers: "Articles & Papers",
  stories: "Stories",
  general: "Other Writings",
  info: "About",
  works: "Works",
  admin: "Admin",
  files: "Files",
};

export function Breadcrumbs() {
  const pathname = usePathname() || "";
  
  // Hide breadcrumbs on homepage
  if (pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  
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
        
        // Resolve label: if it's a post ID, find the post title
        let label = segmentLabels[segment] || segment;
        
        if (segment.length > 10 && index > 0 && segments[index - 1] === "post") {
          const post = posts.find((p) => p.id === segment);
          if (post) {
            label = post.title;
          }
        }

        return (
          <div key={url} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45" />
            {isLast ? (
              <span className="text-foreground font-medium max-w-[200px] sm:max-w-[300px] truncate normal-case">
                {label}
              </span>
            ) : (
              <Link 
                href={url} 
                className="transition-colors hover:text-primary"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
