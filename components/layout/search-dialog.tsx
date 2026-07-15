"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, ArrowRight, FileText, FolderOpen } from "lucide-react";
import { posts as staticPosts } from "@/data/posts";
import { postsApi } from "@/lib/posts-api";
import { Post } from "@/types/post";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  post: Post;
  score: number;
  matchField: string;
}

function scorePost(post: Post, query: string): SearchResult | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  let score = 0;
  let matchField = "";

  const title = post.title?.toLowerCase() || "";
  const excerpt = (post.excerpt || "").toLowerCase();
  const type = post.type?.toLowerCase() || "";
  const cellText = post.cells
    .map((c) => (typeof c.content === "string" ? c.content : JSON.stringify(c.content)))
    .join(" ")
    .toLowerCase()
    .slice(0, 500);

  if (title.includes(q)) { score += 10; matchField = "title"; }
  if (title.startsWith(q)) score += 5;
  if (excerpt.includes(q)) { score += 4; if (!matchField) matchField = "excerpt"; }
  if (type.includes(q)) { score += 3; if (!matchField) matchField = "type"; }
  if (cellText.includes(q)) { score += 1; if (!matchField) matchField = "content"; }

  return score > 0 ? { post, score, matchField } : null;
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allPosts, setAllPosts] = useState<Post[]>(staticPosts);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);
  const router = useRouter();

  // Hydrate with live data once the dialog is first opened
  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    postsApi
      .listPosts({ status: "published" })
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAllPosts(res.data as Post[]);
        }
      })
      .catch(() => { /* keep static fallback */ });
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const allResults = allPosts
      .filter((p) => p.status === "published")
      .map((p) => scorePost(p, query))
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    setResults(allResults);
    setSelectedIndex(0);
  }, [query, allPosts]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[selectedIndex]) {
        router.push(`/post/${results[selectedIndex].post.id}`);
        onClose();
      }
    },
    [results, selectedIndex, router, onClose]
  );

  if (!open) return null;

  const typeIcon = (type: string) =>
    type === "project" ? (
      <FolderOpen className="h-3 w-3 text-primary/70" />
    ) : (
      <FileText className="h-3 w-3 text-muted-foreground" />
    );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div className="relative z-10 w-full max-w-xl mx-4 border border-border/80 bg-background shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search posts, works, writings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground/60"
            aria-autocomplete="list"
            aria-controls="search-results"
          />
          <button
            onClick={onClose}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul
            id="search-results"
            role="listbox"
            className="max-h-[50vh] overflow-y-auto py-2"
          >
            {results.map((result, i) => (
              <li
                key={result.post.id}
                role="option"
                aria-selected={i === selectedIndex}
              >
                <Link
                  href={`/post/${result.post.id}`}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-3 gap-3 transition-colors ${
                    i === selectedIndex
                      ? "bg-primary/8 text-foreground"
                      : "hover:bg-muted/40 text-foreground/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {typeIcon(result.post.type)}
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-snug truncate">
                        {result.post.title}
                      </p>
                      {result.post.excerpt && (
                        <p className="mt-0.5 font-mono text-[10px] uppercase text-muted-foreground truncate">
                          {result.post.excerpt.slice(0, 80)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[9px] uppercase text-muted-foreground border border-border px-1.5 py-0.5">
                      {result.post.type}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {query.trim() && results.length === 0 && (
          <div className="px-4 py-8 text-center font-mono text-xs text-muted-foreground uppercase">
            No results for &quot;{query}&quot;
          </div>
        )}

        {/* Keyboard hints */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
          <span><kbd className="border border-border px-1">↑↓</kbd> Navigate</span>
          <span><kbd className="border border-border px-1">↵</kbd> Open</span>
          <span><kbd className="border border-border px-1">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
