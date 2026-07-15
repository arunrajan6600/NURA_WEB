import { posts } from "@/data/posts";
import { LivePostsList } from "@/components/post/live-posts-list";
import { Metadata } from "next";
import { Post } from "@/types/post";

export const metadata: Metadata = {
  title: "Stories | Arun Nura",
  description: "Creative stories, fiction, and narrative prose by Arun Nura.",
  alternates: {
    canonical: "/posts/stories/",
  },
};

export default function StoriesPage() {
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <section className="site-section">
        <div className="section-heading">
          <p>posts</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            Stories
          </h1>
          <span className="text-xs uppercase text-muted-foreground">
            fiction / literary
          </span>
        </div>
        <LivePostsList
          staticPosts={posts as Post[]}
          postTypes={["story"]}
          emptyMessage="No stories yet."
        />
      </section>
    </div>
  );
}
