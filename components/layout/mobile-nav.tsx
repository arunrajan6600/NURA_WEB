"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => setIsOpen(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] border-l p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <nav className="flex h-full flex-col p-5 font-display text-xs uppercase">
          <div className="mb-8 border-b border-border pb-5 text-muted-foreground">
            index
          </div>
          <Link
            href="/"
            onClick={handleLinkClick}
            className={`mobile-nav-link ${isActive("/") ? "text-primary font-semibold" : ""}`}
          >
            Home
          </Link>
          <Link
            href="/works"
            onClick={handleLinkClick}
            className={`mobile-nav-link ${isActive("/works") || isActive("/projects") ? "text-primary font-semibold" : ""}`}
          >
            Works
          </Link>
          <Link
            href="/posts"
            onClick={handleLinkClick}
            className={`mobile-nav-link ${isActive("/posts") ? "text-primary font-semibold" : ""}`}
          >
            Posts
          </Link>
          <Link
            href="/info"
            onClick={handleLinkClick}
            className={`mobile-nav-link ${isActive("/info") ? "text-primary font-semibold" : ""}`}
          >
            About
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
