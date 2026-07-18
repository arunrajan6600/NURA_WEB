import { LivePostsList } from "@/components/post/live-posts-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles & Papers | Arun Nura",
  description: "Academic papers, publications, research reports, and presentation drafts by Arun Nura.",
  alternates: {
    canonical: "/posts/papers/",
  },
};

export default function PapersPage() {
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <section className="site-section">
        <div className="section-heading">
          <p>posts</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            Articles & Papers
          </h1>
          <span className="text-xs uppercase text-muted-foreground">
            papers / longform
          </span>
        </div>
        <LivePostsList
          postTypes={["paper", "article"]}
          emptyMessage="No articles or papers yet."
        />
      </section>
    </div>
  );
}

