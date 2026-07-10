"use client";

import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const postLinks = [
  { href: "/posts/blog", label: "Blog" },
  { href: "/posts/papers", label: "Articles & Papers" },
  { href: "/posts/stories", label: "Stories" },
  { href: "/posts/general", label: "Other Writings" },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPostsOpen, setIsPostsOpen] = useState(false);

  const handleLinkClick = () => {
    setIsOpen(false);
    setIsPostsOpen(false);
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
        <nav className="flex h-full flex-col p-5 font-mono text-xs uppercase">
          <div className="mb-8 border-b border-border pb-5 text-muted-foreground">
            index
          </div>
          <Link href="/" onClick={handleLinkClick} className="mobile-nav-link">
            Home
          </Link>
          <Link
            href="/works"
            onClick={handleLinkClick}
            className="mobile-nav-link"
          >
            Works
          </Link>
          <Collapsible open={isPostsOpen} onOpenChange={setIsPostsOpen}>
            <CollapsibleTrigger className="mobile-nav-link flex w-full items-center justify-between">
              Posts
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isPostsOpen ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mb-2 grid gap-2 pl-4">
              {postLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="border-l border-border px-3 py-2 text-muted-foreground hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
          <Link
            href="/info"
            onClick={handleLinkClick}
            className="mobile-nav-link"
          >
            About
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
