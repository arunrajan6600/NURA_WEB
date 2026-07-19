"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNav() {
  const pathname = usePathname() || "";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="font-meta text-xs uppercase" aria-label="Main navigation">
      <div className="flex items-center gap-1">
        <Link
          className={`nav-link ${isActive("/") ? "border-border text-primary" : ""}`}
          href="/"
        >
          Home
        </Link>
        <Link
          className={`nav-link ${isActive("/works") || isActive("/projects") ? "border-border text-primary" : ""}`}
          href="/works"
        >
          Works
        </Link>
        <Link
          className={`nav-link ${isActive("/posts") ? "border-border text-primary" : ""}`}
          href="/posts"
        >
          Posts
        </Link>
        <Link
          className={`nav-link ${isActive("/info") ? "border-border text-primary" : ""}`}
          href="/info"
        >
          About
        </Link>
      </div>
    </nav>
  );
}
