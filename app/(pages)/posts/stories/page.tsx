import { posts } from "@/data/posts";
import { PostCard } from "@/components/post/post-card";

export default function StoriesPage() {
  const storyPosts = posts.filter(
    (post) => post.status === "published" && post.type === "story"
  );

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
        <div className="grid gap-3">
          {storyPosts.length > 0 ? (
            storyPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="compact" />
            ))
          ) : (
            <p className="empty-note">No stories yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
