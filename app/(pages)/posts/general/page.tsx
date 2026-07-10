import { posts } from "@/data/posts";
import { PostCard } from "@/components/post/post-card";

export default function GeneralPage() {
  const generalPosts = posts.filter(
    (post) => post.status === "published" && post.type === "general"
  );

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
        <div className="grid gap-3">
          {generalPosts.length > 0 ? (
            generalPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="compact" />
            ))
          ) : (
            <p className="empty-note">No other writings yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
