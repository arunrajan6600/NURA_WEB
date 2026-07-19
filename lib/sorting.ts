/**
 * Shared sorting utilities for all post content types.
 * Used by ProjectsList and LivePostsList to ensure identical sorting behaviour.
 */

import { Post } from "@/types/post";

export type SortMode = "curated" | "newest" | "oldest" | "alphabetical";

/**
 * Get the effective date for a post, used for chronological sorting.
 *
 * Priority:
 *   1. projectMetadata.projectCreationDate — actual work/creation date set by author
 *   2. publishedAt                         — CMS publish date
 *   3. createdAt                           — DB row creation time (always present)
 */
export const getPostDate = (post: Post): number => {
  const pcd = post.projectMetadata?.projectCreationDate;
  if (pcd) {
    const d = new Date(pcd).getTime();
    if (!isNaN(d)) return d;
  }

  if (post.publishedAt) {
    const d = new Date(post.publishedAt).getTime();
    if (!isNaN(d)) return d;
  }

  return new Date(post.createdAt).getTime();
};

/**
 * Sort a list of posts according to the given sort mode.
 * Returns a new array — does not mutate the input.
 */
export const sortPosts = (posts: Post[], mode: SortMode): Post[] => {
  const copy = [...posts];
  return copy.sort((a, b) => {
    if (mode === "curated") {
      // Featured → Pinned → Newest creation date
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return getPostDate(b) - getPostDate(a);
    }
    if (mode === "newest") return getPostDate(b) - getPostDate(a);
    if (mode === "oldest") return getPostDate(a) - getPostDate(b);
    if (mode === "alphabetical") return a.title.localeCompare(b.title);
    // fallback
    return getPostDate(b) - getPostDate(a);
  });
};

/**
 * Extract a 4-digit year string from a post, using the same date priority
 * as getPostDate.  Returns null if nothing is parseable.
 */
export const getPostYear = (post: Post): string | null => {
  const pcd = post.projectMetadata?.projectCreationDate;
  if (pcd) {
    const y = pcd.slice(0, 4);
    if (y && !isNaN(Number(y))) return y;
  }

  const pubDate = post.publishedAt || post.createdAt;
  if (pubDate) {
    const y = pubDate.slice(0, 4);
    if (y && !isNaN(Number(y))) return y;
  }

  return null;
};
