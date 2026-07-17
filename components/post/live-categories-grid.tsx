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

interface LiveCategoriesGridProps {
  staticPosts?: Post[];
  categories: CategoryItem[];
}

export function LiveCategoriesGrid({ categories }: LiveCategoriesGridProps) {
  const [livePosts, setLivePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

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
        console.error("Failed to load live categories count:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
            <p className="mb-10 font-mono text-xs text-muted-foreground">
              {(index + 1).toString().padStart(2, "0")}
            </p>
            <h2 className="text-xl font-medium uppercase group-hover:text-primary">
              {category.label}
            </h2>
            <p className="mt-3 font-mono text-xs uppercase text-muted-foreground">
              {loading ? "…" : `${count} published`}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
