"use client";

import { useState } from "react";
import { posts } from "@/data/posts";
import { PostCard } from "@/components/post/post-card";

type SortMode = "curated" | "chronological" | "archive";

export function ProjectsList() {
  const [sortMode, setSortMode] = useState<SortMode>("curated");

  const projectPosts = posts.filter(
    (post) => post.status === "published" && post.type === "project"
  );

  const displayedPosts = projectPosts.filter((post) => {
    if (sortMode === "archive") {
      return post.archived === true;
    }
    return post.archived !== true;
  });

  const sortedPosts = [...displayedPosts].sort((a, b) => {
    if (sortMode === "curated") {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <section className="site-section">
        <div className="section-heading">
          <p>works</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            Works
          </h1>
          <span className="text-xs uppercase text-muted-foreground">
            video / image / ai / interactive
          </span>
        </div>

        {/* Curation view controls */}
        <div className="mb-8 flex flex-wrap gap-4 font-mono text-xs uppercase" role="group" aria-label="Sort works by">
          <button
            onClick={() => setSortMode("curated")}
            aria-pressed={sortMode === "curated"}
            className={`transition-colors ${
              sortMode === "curated"
                ? "text-primary underline underline-offset-4"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            [ curated ]
          </button>
          <button
            onClick={() => setSortMode("chronological")}
            aria-pressed={sortMode === "chronological"}
            className={`transition-colors ${
              sortMode === "chronological"
                ? "text-primary underline underline-offset-4"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            [ chronological ]
          </button>
          <button
            onClick={() => setSortMode("archive")}
            aria-pressed={sortMode === "archive"}
            className={`transition-colors ${
              sortMode === "archive"
                ? "text-primary underline underline-offset-4"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            [ archive ]
          </button>
        </div>

        <div className="grid gap-5 md:gap-6">
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <p className="empty-note">
              No works found in this section.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
