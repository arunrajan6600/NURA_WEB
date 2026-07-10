import { posts } from "@/data/posts";
import { PostCard } from "@/components/post/post-card";

export default function ProjectsPage() {
  const publishedPosts = posts.filter(
    (post) => post.status === "published" && post.type === "project"
  );

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <section className="site-section">
        <div className="section-heading">
          <p>works</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            Works
          </h1>
          <span className="text-xs uppercase text-muted-foreground">
            video / image / ai / interactive
          </span>
        </div>
        <div className="grid gap-5 md:gap-6">
          {publishedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
