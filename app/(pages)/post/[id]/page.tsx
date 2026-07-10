import { notFound } from "next/navigation";
import { posts } from "@/data/posts";
import { PostCell } from "@/components/post/post-cell";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

type Post = (typeof posts)[number];

function getPost(id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}

// Validate and transform params to ensure they're sanitized
function validateAndParseId(rawId: unknown) {
  return typeof rawId === "string" ? rawId : "";
}

function getBackLink(post: Post) {
  switch (post.type) {
    case "project":
      return { href: "/works", label: "Works" };
    case "paper":
    case "article":
      return { href: "/posts/papers", label: "Articles & Papers" };
    case "story":
      return { href: "/posts/stories", label: "Stories" };
    case "general":
      return { href: "/posts/general", label: "Other Writings" };
    case "blog":
    default:
      return { href: "/posts/blog", label: "Blog" };
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resolvedId = validateAndParseId(id);
  const post = getPost(resolvedId);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
  };
}

// Generate static params for all published posts
export async function generateStaticParams() {
  // Handle case where posts array might be empty or undefined
  if (!posts || posts.length === 0) {
    console.warn("No posts available for generateStaticParams - returning placeholder");
    // Return a placeholder param to satisfy Next.js static export requirements
    return [{ id: "placeholder" }];
  }
  
  // Filter out placeholder posts and only include published posts
  const publishedPosts = posts.filter((post) => 
    post.status === "published" && post.id !== "placeholder"
  );
  
  if (publishedPosts.length === 0) {
    console.warn("No published posts found for generateStaticParams - returning placeholder");
    // Return a placeholder param to satisfy Next.js static export requirements
    return [{ id: "placeholder" }];
  }
  
  return publishedPosts.map((post) => ({
    id: post.id,
  }));
}

export default async function PostPage({ params }: Props) {
  // Validate and parse id
  const { id } = await params;
  const resolvedId = validateAndParseId(id);
  
  // Handle placeholder case - redirect to 404
  if (resolvedId === "placeholder") {
    notFound();
  }
  
  const post = getPost(resolvedId);

  if (!post || post.status !== "published") {
    notFound();
  }

  const formattedDate = formatDistance(new Date(post.updatedAt), new Date(), {
    addSuffix: true,
  });
  const backLink = getBackLink(post);

  return (
    <article className="max-w-4xl mx-auto py-8">
      <Button variant="ghost" className="mb-8" asChild>
        <Link href={backLink.href}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {backLink.label}
        </Link>
      </Button>

      <div className="space-y-6 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          {post.title}
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Updated {formattedDate}
        </p>
      </div>

      <div className="space-y-12">
        {post.cells.map((cell) => (
          <PostCell key={cell.id} cell={cell} />
        ))}
      </div>
    </article>
  );
}
