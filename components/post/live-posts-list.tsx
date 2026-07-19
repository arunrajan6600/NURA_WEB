"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Post } from "@/types/post";
import { postsApi } from "@/lib/posts-api";
import { PostCard } from "./post-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { type SortMode, sortPosts, getPostYear } from "@/lib/sorting";

interface LivePostsListProps {
  postTypes: string[];
  emptyMessage?: string;
}

export function LivePostsList({
  postTypes,
  emptyMessage = "No posts yet.",
}: LivePostsListProps) {
  const [livePosts, setLivePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  // Controls
  const [sortMode, setSortMode] = useState<SortMode>("curated");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedTech, setSelectedTech] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    postsApi
      .listPosts({ status: "published" })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setLivePosts(res.data as Post[]);
        }
      })
      .catch((err) => {
        console.error("Failed to load live posts list:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Base pool: only published posts matching the requested types
  const allPosts = useMemo(
    () =>
      livePosts.filter(
        (post) => post.status === "published" && postTypes.includes(post.type)
      ),
    [livePosts, postTypes]
  );

  // Dynamically collect filter options from the pool
  const filterOptions = useMemo(() => {
    const tags = new Set<string>();
    const years = new Set<string>();
    const technologies = new Set<string>();

    allPosts.forEach((post) => {
      post.tags?.forEach((t) => tags.add(t.toLowerCase()));
      const y = getPostYear(post);
      if (y) years.add(y);
      post.projectMetadata?.technologies?.forEach((t) => technologies.add(t));
    });

    return {
      tags: Array.from(tags).sort(),
      years: Array.from(years).sort((a, b) => b.localeCompare(a)),
      technologies: Array.from(technologies).sort(),
    };
  }, [allPosts]);

  // Filtering
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      // Archive toggle
      if (showArchived) {
        if (post.archived !== true) return false;
      } else {
        if (post.archived === true) return false;
      }

      // Featured toggle
      if (featuredOnly && !post.featured) return false;

      // Tag filter
      if (selectedTag !== "all") {
        const postTags = post.tags?.map((t) => t.toLowerCase()) || [];
        if (!postTags.includes(selectedTag.toLowerCase())) return false;
      }

      // Year filter
      if (selectedYear !== "all") {
        if (getPostYear(post) !== selectedYear) return false;
      }

      // Technology filter
      if (selectedTech !== "all") {
        const postTech = post.projectMetadata?.technologies || [];
        if (!postTech.includes(selectedTech)) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = post.title.toLowerCase().includes(q);
        const inExcerpt = post.excerpt?.toLowerCase().includes(q) ?? false;
        const inTags = post.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        if (!inTitle && !inExcerpt && !inTags) return false;
      }

      return true;
    });
  }, [allPosts, showArchived, featuredOnly, selectedTag, selectedYear, selectedTech, searchQuery]);

  // Sorting
  const sortedPosts = useMemo(
    () => sortPosts(filteredPosts, sortMode),
    [filteredPosts, sortMode]
  );

  const isAnyFilterActive =
    searchQuery !== "" ||
    selectedTag !== "all" ||
    selectedYear !== "all" ||
    selectedTech !== "all" ||
    featuredOnly ||
    showArchived;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTag("all");
    setSelectedYear("all");
    setSelectedTech("all");
    setFeaturedOnly(false);
    setShowArchived(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid gap-3">
        <div className="h-14 rounded bg-muted/20 animate-pulse" />
        <div className="h-14 rounded bg-muted/20 animate-pulse" />
        <div className="h-14 rounded bg-muted/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search + Filter row */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="pl-9 h-10 font-display text-sm border-border bg-background"
              aria-label="Search posts"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground focus:outline-none"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-4 font-display text-xs uppercase gap-2 border-border ${
              showFilters ? "bg-muted text-foreground" : "bg-background"
            }`}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {isAnyFilterActive && (
              <span className="ml-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        </div>

        {/* Advanced Filter Panel */}
        {showFilters && (
          <Card className="p-4 border-border bg-card/50 space-y-4">
            <div className={`grid grid-cols-1 gap-4 ${
              filterOptions.technologies.length > 0
                ? "sm:grid-cols-2 md:grid-cols-3"
                : "sm:grid-cols-2"
            }`}>
              {/* Tag Filter */}
              {filterOptions.tags.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="font-display text-[10px] uppercase text-muted-foreground">
                    Filter by Tag
                  </Label>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger className="h-9 font-display text-xs border-border bg-background">
                      <SelectValue placeholder="All Tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {filterOptions.tags.map((tag) => (
                        <SelectItem key={tag} value={tag} className="font-display text-xs lowercase">
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Year Filter */}
              {filterOptions.years.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="font-display text-[10px] uppercase text-muted-foreground">
                    Filter by Year
                  </Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-9 font-display text-xs border-border bg-background">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {filterOptions.years.map((year) => (
                        <SelectItem key={year} value={year} className="font-display text-xs">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Technology Filter — only shown when posts have tech metadata */}
              {filterOptions.technologies.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="font-display text-[10px] uppercase text-muted-foreground">
                    Filter by Technology
                  </Label>
                  <Select value={selectedTech} onValueChange={setSelectedTech}>
                    <SelectTrigger className="h-9 font-display text-xs border-border bg-background">
                      <SelectValue placeholder="All Technologies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Technologies</SelectItem>
                      {filterOptions.technologies.map((tech) => (
                        <SelectItem key={tech} value={tech} className="font-display text-xs lowercase">
                          {tech}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Toggles + Reset */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/40">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="lpl-featured-only"
                    checked={featuredOnly}
                    onCheckedChange={setFeaturedOnly}
                  />
                  <Label htmlFor="lpl-featured-only" className="font-display text-xs uppercase cursor-pointer">
                    Featured Only
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="lpl-show-archived"
                    checked={showArchived}
                    onCheckedChange={setShowArchived}
                  />
                  <Label htmlFor="lpl-show-archived" className="font-display text-xs uppercase cursor-pointer">
                    Show Archive
                  </Label>
                </div>
              </div>

              {isAnyFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="font-display text-xs uppercase h-8 hover:text-destructive"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Sort controls — identical markup to ProjectsList */}
      <div
        className="flex flex-wrap gap-4 font-display text-xs uppercase"
        role="group"
        aria-label="Sort posts by"
      >
        {(["curated", "newest", "oldest", "alphabetical"] as SortMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            aria-pressed={sortMode === mode}
            className={`transition-colors focus:outline-none ${
              sortMode === mode
                ? "text-primary underline underline-offset-4 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            [ {mode} ]
          </button>
        ))}
      </div>

      {/* Post list */}
      <div className="grid gap-3">
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <PostCard key={post.id} post={post} variant="compact" />
          ))
        ) : (
          <p className="empty-note text-center py-8 text-sm text-muted-foreground italic">
            {isAnyFilterActive ? "No posts match the current filters." : emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
}
