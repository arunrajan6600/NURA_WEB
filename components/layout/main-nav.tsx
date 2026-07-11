"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";

const postLinks = [
  { href: "/posts/blog", label: "Blog" },
  { href: "/posts/papers", label: "Articles & Papers" },
  { href: "/posts/stories", label: "Stories" },
  { href: "/posts/general", label: "Other Writings" },
];

export function MainNav() {
  const pathname = usePathname() || "";
  const [isPostsOpen, setIsPostsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openPosts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPostsOpen(true);
  }, []);

  const closePosts = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsPostsOpen(false), 160);
  }, []);

  const closeNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPostsOpen(false);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="font-mono text-xs uppercase" aria-label="Main navigation">
      <div className="flex items-center gap-1">
        <Link className={`nav-link ${isActive("/") ? "border-border text-primary" : ""}`} href="/">
          Home
        </Link>
        <Link className={`nav-link ${isActive("/works") || isActive("/projects") ? "border-border text-primary" : ""}`} href="/works">
          Works
        </Link>
        <div onMouseEnter={openPosts} onMouseLeave={closePosts} onFocus={openPosts} onBlur={closePosts}>
          <Link
            className={`nav-link ${isActive("/posts") ? "border-border text-primary" : ""}`}
            href="/posts"
            aria-haspopup="true"
            aria-expanded={isPostsOpen}
          >
            Posts
          </Link>
        </div>
        <Link className={`nav-link ${isActive("/info") ? "border-border text-primary" : ""}`} href="/info">
          About
        </Link>
      </div>

      {isPostsOpen && (
        <div
          className="fixed left-0 right-0 top-14 border-b border-border/80 bg-background/95 backdrop-blur"
          onMouseEnter={openPosts}
          onMouseLeave={closePosts}
          role="menu"
          aria-label="Posts sections"
        >
          <div className="mx-auto grid max-w-6xl gap-1 px-6 py-5 md:grid-cols-4">
            {postLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                className={`border px-4 py-3 transition-colors hover:border-primary hover:text-primary ${
                  pathname === link.href
                    ? "border-primary text-primary"
                    : "border-border/70 text-foreground/80"
                }`}
                onClick={closeNow}
              >
                <span className="mr-3 text-muted-foreground">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
