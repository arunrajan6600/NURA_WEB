"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { SearchDialog } from "@/components/layout/search-dialog";

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-border/70 px-2.5 py-1.5 font-display text-[10px] uppercase text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        aria-label="Open search (Ctrl+K)"
      >
        <Search className="h-3 w-3" />
        <span className="hidden sm:inline">search</span>
        <kbd className="hidden sm:inline border border-border/60 px-1 text-[9px]">⌘K</kbd>
      </button>

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
