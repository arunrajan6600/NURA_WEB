import type { Metadata } from "next";
import { LiveCategoriesGrid } from "@/components/post/live-categories-grid";

export const metadata: Metadata = {
  title: "Posts | Arun Nura",
  description: "Writings, research papers, stories, and articles by Arun Nura.",
  alternates: {
    canonical: "/posts/",
  },
};

const categories = [
  {
    href: "/posts/blog",
    label: "Blog",
    types: ["blog"],
  },
  {
    href: "/posts/papers",
    label: "Articles & Papers",
    types: ["article", "paper"],
  },
  {
    href: "/posts/stories",
    label: "Stories",
    types: ["story"],
  },
  {
    href: "/posts/general",
    label: "Other Writings",
    types: ["general"],
  },
];

export default function PostsPage() {
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <section className="site-section">
        <div className="section-heading">
          <p>posts</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            Posts
          </h1>
          <span className="text-xs uppercase text-muted-foreground">
            blog / papers / stories
          </span>
        </div>

        <LiveCategoriesGrid
          categories={categories}
        />
      </section>
    </div>
  );
}
