import Link from "next/link";
import { posts } from "@/data/posts";
import { Metadata } from "next";

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

        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((category, index) => {
            const count = posts.filter(
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
                  {count} published
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
