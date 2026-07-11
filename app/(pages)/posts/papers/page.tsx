import { posts } from "@/data/posts";
import { PostCard } from "@/components/post/post-card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles & Papers | Arun Nura",
  description: "Academic papers, publications, research reports, and presentation drafts by Arun Nura.",
  alternates: {
    canonical: "/posts/papers/",
  },
};

export default function PapersPage() {
  const paperAndArticlePosts = posts.filter(
    (post) =>
      post.status === "published" &&
      (post.type === "paper" || post.type === "article")
  );

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
        <div className="grid gap-3">
          {paperAndArticlePosts.length > 0 ? (
            paperAndArticlePosts.map((post) => (
              <PostCard key={post.id} post={post} variant="compact" />
            ))
          ) : (
            <p className="empty-note">No articles or papers yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
