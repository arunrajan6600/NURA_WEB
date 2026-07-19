"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Post } from "@/types/post";
import { postsApi } from "@/lib/posts-api";

interface CategoryItem {
  href: string;
  label: string;
  types: string[];
}

export function LiveCategoriesGrid() {
  const [livePosts, setLivePosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Load both posts and active content types
    Promise.all([
      postsApi.listPosts({ status: "published" }),
      postsApi.listContentTypes()
    ])
      .then(([postsRes, typesRes]) => {
        if (postsRes.success && Array.isArray(postsRes.data)) {
          setLivePosts(postsRes.data as Post[]);
        }

        if (typesRes.success && Array.isArray(typesRes.data)) {
          // Construct categories based on backend content types order and status
          const sortedTypes = [...typesRes.data].filter((t: any) => t.enabled);

          const mappedCategories = sortedTypes.map((type: any) => {
            if (type.slug === "project") {
              // Projects are rendered in the /works section, not under /posts
              return null;
            }

            if (type.slug === "blog") {
              return {
                href: "/posts/blog",
                label: "Blog",
                types: ["blog"],
              };
            }

            if (type.slug === "paper") {
              return {
                href: "/posts/papers",
                label: "Articles & Papers",
                types: ["paper", "article"], // Include legacy article
              };
            }

            if (type.slug === "story") {
              return {
                href: "/posts/stories",
                label: "Stories",
                types: ["story"],
              };
            }

            // Custom dynamic content type or legacy general
            return {
              href: `/posts/${type.slug}`,
              label: type.name,
              types: [type.slug],
            };
          }).filter(Boolean) as CategoryItem[];

          setCategories(mappedCategories);
        }
      })
      .catch((err) => {
        console.error("Failed to load live categories:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading && categories.length === 0) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 border border-border bg-card/40 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {categories.map((category, index) => {
        const count = livePosts.filter(
          (post) =>
            post.status === "published" &&
            category.types.includes(post.type)
        ).length;

        return (
          <Link
            key={category.href}
            href={category.href}
            className="group border border-border bg-card/70 px-4 py-5 transition-colors hover:border-primary hover:bg-card"
          >
            <p className="mb-10 font-display text-xs text-muted-foreground">
              {(index + 1).toString().padStart(2, "0")}
            </p>
            <h2 className="text-xl font-medium uppercase group-hover:text-primary">
              {category.label}
            </h2>
            <p className="mt-3 font-display text-xs uppercase text-muted-foreground">
              {loading ? "…" : `${count} published`}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
