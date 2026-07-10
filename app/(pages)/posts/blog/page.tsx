import { posts } from "@/data/posts";
import { PostCard } from "@/components/post/post-card";

export default function BlogPage() {
  const publishedPosts = posts.filter(
    (post) => post.status === "published" && post.type === "blog"
  );

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
        <div className="grid gap-3">
          {publishedPosts.length > 0 ? (
            publishedPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="compact" />
            ))
          ) : (
            <p className="empty-note">No blog posts yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
