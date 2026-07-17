import { LivePostsList } from "@/components/post/live-posts-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles | Arun Nura",
  description: "Essays, critical writings, and short articles by Arun Nura.",
  alternates: {
    canonical: "/posts/articles/",
  },
};

export default function ArticlesPage() {
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <section className="site-section">
        <div className="section-heading">
          <p>posts</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            Articles
          </h1>
          <span className="text-xs uppercase text-muted-foreground">
            essays / research
          </span>
        </div>
        <LivePostsList
          postTypes={["article"]}
          emptyMessage="No articles yet."
        />
      </section>
    </div>
  );
}
