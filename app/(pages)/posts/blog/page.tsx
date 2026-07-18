import { LivePostsList } from "@/components/post/live-posts-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Arun Nura",
  description: "Notes, process, and field log of Arun Nura's artistic activities.",
  alternates: {
    canonical: "/posts/blog/",
  },
};

export default function BlogPage() {
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <section className="site-section">
        <div className="section-heading">
          <p>posts</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">Blog</h1>
          <span className="text-xs uppercase text-muted-foreground">
            notes / process / field log
          </span>
        </div>
        <LivePostsList
          postTypes={["blog"]}
          emptyMessage="No blog posts yet."
        />
      </section>
    </div>
  );
}

