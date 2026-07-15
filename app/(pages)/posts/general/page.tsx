import { posts } from "@/data/posts";
import { LivePostsList } from "@/components/post/live-posts-list";
import { Metadata } from "next";
import { Post } from "@/types/post";

export const metadata: Metadata = {
  title: "Other Writings | Arun Nura",
  description: "General thoughts, logs, and miscellaneous short writings by Arun Nura.",
  alternates: {
    canonical: "/posts/general/",
  },
};

export default function GeneralPage() {
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <section className="site-section">
        <div className="section-heading">
          <p>posts</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            Other Writings
          </h1>
          <span className="text-xs uppercase text-muted-foreground">
            fragments / notes
          </span>
        </div>
        <LivePostsList
          staticPosts={posts as Post[]}
          postTypes={["general"]}
          emptyMessage="No other writings yet."
        />
      </section>
    </div>
  );
}
