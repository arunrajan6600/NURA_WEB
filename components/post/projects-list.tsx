"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { postsApi } from "@/lib/posts-api";
import { Post } from "@/types/post";
import { PostCard } from "@/components/post/post-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SortMode, sortPosts } from "@/lib/sorting";

function ProjectCardSkeleton() {
  return (
    <Card className="w-full overflow-hidden border border-border/40 bg-card/10 animate-pulse">
      <div className="aspect-video w-full bg-muted/20" />
      <div className="p-5 md:p-6 space-y-4">
        <div className="h-2.5 w-1/4 bg-muted/20 rounded" />
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-muted/20 rounded animate-none" />
          <div className="h-3 w-1/5 bg-muted/20 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted/15 rounded" />
          <div className="h-3 w-5/6 bg-muted/15 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-4 w-12 bg-muted/20 rounded-sm" />
          <div className="h-4 w-16 bg-muted/20 rounded-sm" />
        </div>
      </div>
    </Card>
  );
}

export function ProjectsList() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedTech, setSelectedTech] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("curated");
  const [showArchived, setShowArchived] = useState(false);
  // Always start empty – never use stale static data as initial state
  const [livePosts, setLivePosts] = useState<Post[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    setMounted(true);

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    postsApi
      .listPosts({ status: "published", type: "project" })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setLivePosts(res.data as Post[]);
        }
      })
      .catch(() => {
        // API unavailable – show nothing rather than stale data
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter only published projects from whichever data source we have
  const allProjects = useMemo(() => {
    return livePosts.filter(
      (post) => post.status === "published" && post.type === "project"
    );
  }, [livePosts]);

  // Dynamically collect unique categories, technologies, tags, and years
  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const technologies = new Set<string>();
    const tags = new Set<string>();
    const years = new Set<string>();

    allProjects.forEach((post) => {
      // Tags
      if (post.tags) {
        post.tags.forEach((t) => tags.add(t.toLowerCase()));
      }
      
      // Project metadata
      const pm = post.projectMetadata;
      if (pm) {
        if (pm.category) categories.add(pm.category);
        if (pm.technologies) {
          pm.technologies.forEach((t) => technologies.add(t));
        }
        if (pm.year) years.add(pm.year);
      }
    });

    return {
      categories: Array.from(categories).sort(),
      technologies: Array.from(technologies).sort(),
      tags: Array.from(tags).sort(),
      years: Array.from(years).sort((a, b) => b.localeCompare(a)), // Newest year first
    };
  }, [allProjects]);

  // Filtering logic
  const filteredPosts = useMemo(() => {
    return allProjects.filter((post) => {
      // Archive filter
      if (showArchived) {
        if (post.archived !== true) return false;
      } else {
        if (post.archived === true) return false;
      }

      // Featured filter
      if (featuredOnly && !post.featured) return false;

      // Tag filter
      if (selectedTag !== "all") {
        const postTags = post.tags?.map((t) => t.toLowerCase()) || [];
        if (!postTags.includes(selectedTag.toLowerCase())) return false;
      }

      // Tech filter
      if (selectedTech !== "all") {
        const postTech = post.projectMetadata?.technologies || [];
        if (!postTech.includes(selectedTech)) return false;
      }

      // Category filter
      if (selectedCategory !== "all") {
        if (post.projectMetadata?.category !== selectedCategory) return false;
      }

      // Year filter
      if (selectedYear !== "all") {
        if (post.projectMetadata?.year !== selectedYear) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pm = post.projectMetadata;
        const textToSearch = [
          post.title,
          post.excerpt ?? "",
          pm?.subtitle ?? "",
          pm?.category ?? "",
          pm?.medium ?? "",
          pm?.role ?? "",
          pm?.client ?? "",
          pm?.teamMembers ?? "",
          ...(post.tags || []),
          ...(pm?.technologies || []),
          ...(pm?.tools || []),
          ...post.cells.map((c) =>
            typeof c.content === "string" ? c.content : JSON.stringify(c.content)
          ),
        ]
          .join(" ")
          .toLowerCase();

        if (!textToSearch.includes(q)) return false;
      }

      return true;
    });
  }, [
    allProjects,
    showArchived,
    featuredOnly,
    selectedTag,
    selectedTech,
    selectedCategory,
    selectedYear,
    searchQuery,
  ]);

  // Sorting — delegates to shared lib/sorting.ts (same logic used by all content types)
  const sortedPosts = useMemo(
    () => sortPosts(filteredPosts, sortMode),
    [filteredPosts, sortMode]
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTag("all");
    setSelectedTech("all");
    setSelectedCategory("all");
    setSelectedYear("all");
    setFeaturedOnly(false);
    setShowArchived(false);
  };

  const isAnyFilterActive =
    searchQuery !== "" ||
    selectedTag !== "all" ||
    selectedTech !== "all" ||
    selectedCategory !== "all" ||
    selectedYear !== "all" ||
    featuredOnly ||
    showArchived;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <section className="site-section">
        <div className="section-heading mb-6">
          <p>works</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            Works
          </h1>
          <span className="text-xs uppercase text-muted-foreground font-display">
            video / image / ai / interactive
          </span>
        </div>

        {/* Search, Filter Toggles & Sort Row */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search works…"
                className="pl-9 h-10 font-display text-sm border-border bg-background"
                aria-label="Search posts text"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground focus:outline-none"
                  aria-label="Clear search query"
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
            <Card className="p-4 border-border bg-card/50 space-y-4 transition-all duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Tag Filter */}
                <div className="space-y-1.5">
                  <Label className="font-display text-[10px] uppercase text-muted-foreground">Filter by Tag</Label>
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

                {/* Tech Filter */}
                <div className="space-y-1.5">
                  <Label className="font-display text-[10px] uppercase text-muted-foreground">Filter by Technology</Label>
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

                {/* Category Filter */}
                <div className="space-y-1.5">
                  <Label className="font-display text-[10px] uppercase text-muted-foreground">Filter by Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-9 font-display text-xs border-border bg-background">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {filterOptions.categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="font-display text-xs lowercase">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Filter */}
                <div className="space-y-1.5">
                  <Label className="font-display text-[10px] uppercase text-muted-foreground">Filter by Year</Label>
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
              </div>

              {/* Toggles and Reset */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/40">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="featured-only"
                      checked={featuredOnly}
                      onCheckedChange={setFeaturedOnly}
                    />
                    <Label htmlFor="featured-only" className="font-display text-xs uppercase cursor-pointer">
                      Featured Only
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-archived"
                      checked={showArchived}
                      onCheckedChange={setShowArchived}
                    />
                    <Label htmlFor="show-archived" className="font-display text-xs uppercase cursor-pointer">
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

        {/* Sorting controls */}
        <div className="mb-8 flex flex-wrap gap-4 font-display text-xs uppercase" role="group" aria-label="Sort works by">
          <button
            onClick={() => setSortMode("curated")}
            aria-pressed={sortMode === "curated"}
            className={`transition-colors focus:outline-none ${
              sortMode === "curated"
                ? "text-primary underline underline-offset-4 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            [ curated ]
          </button>
          <button
            onClick={() => setSortMode("newest")}
            aria-pressed={sortMode === "newest"}
            className={`transition-colors focus:outline-none ${
              sortMode === "newest"
                ? "text-primary underline underline-offset-4 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            [ newest ]
          </button>
          <button
            onClick={() => setSortMode("oldest")}
            aria-pressed={sortMode === "oldest"}
            className={`transition-colors focus:outline-none ${
              sortMode === "oldest"
                ? "text-primary underline underline-offset-4 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            [ oldest ]
          </button>
          <button
            onClick={() => setSortMode("alphabetical")}
            aria-pressed={sortMode === "alphabetical"}
            className={`transition-colors focus:outline-none ${
              sortMode === "alphabetical"
                ? "text-primary underline underline-offset-4 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            [ alphabetical ]
          </button>
        </div>

        {/* Accessibility Polite count announcement */}
        <div className="sr-only" aria-live="polite">
          {filteredPosts.length} works found.
        </div>

        {/* Posts Rendering */}
        <div className="grid gap-6">
          {!mounted || loading ? (
            <>
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </>
          ) : sortedPosts.length > 0 ? (
            sortedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-16 px-4 border border-dashed border-border/50 rounded-lg bg-card/10 space-y-4">
              <p className="font-display text-xs uppercase text-muted-foreground">
                No works found matching the active filters.
              </p>
              {isAnyFilterActive && (
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                  className="font-display text-xs uppercase h-8"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

