import { posts } from "@/data/posts";
import { PostCard } from "@/components/post/post-card";

export default function ArticlesPage() {
  const articlePosts = posts.filter(
    (post) => post.status === "published" && post.type === "article"
  );

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
        <div className="grid gap-3">
          {articlePosts.length > 0 ? (
            articlePosts.map((post) => (
              <PostCard key={post.id} post={post} variant="compact" />
            ))
          ) : (
            <p className="empty-note">No articles yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
