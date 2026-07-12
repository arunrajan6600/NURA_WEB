import { notFound } from "next/navigation";
import { posts } from "@/data/posts";
import { PostCell } from "@/components/post/post-cell";
import { PostCard } from "@/components/post/post-card";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { Metadata } from "next";
import { Post } from "@/types/post";
import { CitationBlock } from "@/components/post/citation-block";
import { TableOfContents } from "@/components/post/table-of-contents";
import { ShareSection } from "@/components/post/share-section";

interface Props {
  params: Promise<{ id: string }>;
}

function getPost(id: string): Post | undefined {
  return posts.find((p) => p.id === id) as Post | undefined;
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

// Helper to retrieve related works based on metadata, tags, and category match
const getRelatedWorks = (currentPost: Post, count = 2) => {
  if (currentPost.type !== "project") return [];

  const candidates = posts.filter(
    (p) =>
      p.status === "published" &&
      p.type === "project" &&
      p.id !== currentPost.id &&
      p.archived !== true
  ) as Post[];

  const getTags = (p: Post) => {
    const tags = new Set<string>();
    const text = [p.title, p.excerpt ?? ""].join(" ").toLowerCase();
    if (p.cells.some((c) => c.type === "video") || text.includes("video"))
      tags.add("video");
    if (p.thumbnail || p.cells.some((c) => c.type === "image"))
      tags.add("image");
    if (/\b(ai|yolo|model|embedding|chatgpt)\b/.test(text)) tags.add("ai");
    if (/\b(interactive|controlled|touchdesigner|vcv|api|sensor)\b/.test(text))
      tags.add("interactive");
    if (/\b(code|python|shader|api)\b/.test(text)) tags.add("code");
    return tags;
  };

  const currentTags = getTags(currentPost);

  const scored = candidates.map((p) => {
    let score = 0;

    // Match medium
    if (
      currentPost.projectMetadata?.medium &&
      p.projectMetadata?.medium &&
      currentPost.projectMetadata.medium.toLowerCase() ===
        p.projectMetadata.medium.toLowerCase()
    ) {
      score += 3;
    }

    // Match researchArea
    if (
      currentPost.projectMetadata?.researchArea &&
      p.projectMetadata?.researchArea &&
      currentPost.projectMetadata.researchArea.toLowerCase() ===
        p.projectMetadata.researchArea.toLowerCase()
    ) {
      score += 3;
    }

    // Match tags
    const pTags = getTags(p);
    pTags.forEach((tag) => {
      if (currentTags.has(tag)) score += 1;
    });

    return { post: p, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.post);
};

// Helper to retrieve related writings based on type/tags match
const getRelatedWritings = (currentPost: Post, count = 2) => {
  if (currentPost.type === "project") return [];

  const candidates = posts.filter(
    (p) =>
      p.status === "published" &&
      p.type !== "project" &&
      p.id !== currentPost.id &&
      p.archived !== true
  ) as Post[];

  const getTags = (p: Post) => {
    const tags = new Set<string>();
    const text = [p.title, p.excerpt ?? ""].join(" ").toLowerCase();
    if (/\b(ai|yolo|model|embedding|chatgpt)\b/.test(text)) tags.add("ai");
    if (/\b(code|python|shader|api)\b/.test(text)) tags.add("code");
    return tags;
  };

  const currentTags = getTags(currentPost);

  const scored = candidates.map((p) => {
    let score = 0;
    
    // Match type
    if (currentPost.type === p.type) {
      score += 4;
    }
    
    // Match tags
    const pTags = getTags(p);
    pTags.forEach((tag) => {
      if (currentTags.has(tag)) score += 1;
    });

    return { post: p, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.post);
};

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arunrajan6600.github.io/nuraweb";
  const isProject = post.type === "project";

  return {
    title: `${post.title} | Arun Nura`,
    description: post.excerpt || `Arun Nura - ${post.title}`,
    alternates: {
      canonical: `/post/${post.id}/`,
    },
    openGraph: {
      title: `${post.title} | Arun Nura`,
      description: post.excerpt || `Arun Nura - ${post.title}`,
      url: `${siteUrl}/post/${post.id}/`,
      type: isProject ? "website" : "article",
      images: post.thumbnail?.url ? [{ url: post.thumbnail.url, alt: post.thumbnail.alt }] : [],
    },
    twitter: {
      card: post.thumbnail?.url ? "summary_large_image" : "summary",
      title: `${post.title} | Arun Nura`,
      description: post.excerpt || `Arun Nura - ${post.title}`,
      images: post.thumbnail?.url ? [post.thumbnail.url] : [],
    }
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

  // Navigation sequencing
  const sameTypePosts = posts.filter(
    (p) => p.status === "published" && p.type === post.type
  );
  const currentIndex = sameTypePosts.findIndex((p) => p.id === post.id);
  const prevPost = currentIndex > 0 ? sameTypePosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex >= 0 && currentIndex < sameTypePosts.length - 1
      ? sameTypePosts[currentIndex + 1]
      : null;

  // Retrieve related works
  const relatedWorks = getRelatedWorks(post, 2);
  const relatedWritings = getRelatedWritings(post, 2);

  // Calculate reading time
  const allText = post.cells
    .map((c) => (typeof c.content === "string" ? c.content : JSON.stringify(c.content ?? "")))
    .join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Extract markdown content for TOC
  const markdownContent = post.cells
    .filter((c) => c.type === "markdown")
    .map((c) => (typeof c.content === "string" ? c.content : ""))
    .join("\n\n");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arunrajan6600.github.io/nuraweb";
  const postUrl = `${siteUrl}/post/${post.id}`;
  const schema = post.type === "project" 
    ? {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": post.title,
        "headline": post.title,
        "description": post.excerpt || `Project by Arun Nura: ${post.title}`,
        "creator": {
          "@type": "Person",
          "name": "Arun Nura",
          "url": siteUrl
        },
        "dateCreated": post.createdAt,
        "dateModified": post.updatedAt,
        "image": post.thumbnail?.url ? [post.thumbnail.url] : []
      }
    : {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.excerpt || `Article by Arun Nura: ${post.title}`,
        "datePublished": post.createdAt,
        "dateModified": post.updatedAt,
        "author": {
          "@type": "Person",
          "name": "Arun Nura",
          "url": siteUrl
        },
        "image": post.thumbnail?.url ? [post.thumbnail.url] : []
      };

  return (
    <article className="max-w-4xl mx-auto py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Button variant="ghost" className="mb-8" asChild>
        <Link href={backLink.href}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {backLink.label}
        </Link>
      </Button>

      <div className="space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground font-mono uppercase">
          <span>Updated {formattedDate}</span>
          {post.type !== "project" && (
            <>
              <span>/</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readingMinutes} min read
              </span>
            </>
          )}
          {post.projectMetadata?.year && (
            <>
              <span>/</span>
              <span className="text-foreground/80">{post.projectMetadata.year}</span>
            </>
          )}
          {post.projectMetadata?.medium && (
            <>
              <span>/</span>
              <span className="text-foreground/80">{post.projectMetadata.medium}</span>
            </>
          )}
          {post.projectMetadata?.duration && (
            <>
              <span>/</span>
              <span className="text-foreground/80">{post.projectMetadata.duration}</span>
            </>
          )}
        </div>
      </div>

      {post.researchMetadata && (
        <div className="mb-12 border-y border-border py-8 font-mono text-xs uppercase space-y-4">
          {post.researchMetadata.authors && (
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <span className="text-muted-foreground">authors:</span>
              <span className="lowercase text-foreground/90">{post.researchMetadata.authors}</span>
            </div>
          )}
          {post.researchMetadata.publicationYear && (
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <span className="text-muted-foreground">year:</span>
              <span className="lowercase text-foreground/90">{post.researchMetadata.publicationYear}</span>
            </div>
          )}
          {post.researchMetadata.venue && (
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <span className="text-muted-foreground">venue:</span>
              <span className="lowercase text-foreground/90">{post.researchMetadata.venue}</span>
            </div>
          )}
          {post.researchMetadata.researchCategory && (
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <span className="text-muted-foreground">category:</span>
              <span className="lowercase text-foreground/90">{post.researchMetadata.researchCategory}</span>
            </div>
          )}
          {post.researchMetadata.abstract && (
            <div className="border-t border-border pt-4 mt-4 uppercase">
              <p className="text-muted-foreground mb-2">abstract:</p>
              <p className="text-foreground/80 normal-case leading-relaxed font-sans text-sm max-w-3xl">
                {post.researchMetadata.abstract}
              </p>
            </div>
          )}
          {post.researchMetadata.keywords && post.researchMetadata.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-muted-foreground mr-2">keywords:</span>
              {post.researchMetadata.keywords.map((kw) => (
                <span key={kw} className="border border-border px-2 py-0.5 lowercase text-muted-foreground text-[10px]">
                  {kw}
                </span>
              ))}
            </div>
          )}
          {((post.researchMetadata.externalLinks && post.researchMetadata.externalLinks.length > 0) || post.researchMetadata.pdfAttachment) && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-border mt-4">
              {post.researchMetadata.pdfAttachment && (
                <a
                  href={post.researchMetadata.pdfAttachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  [ read pdf ]
                </a>
              )}
              {post.researchMetadata.externalLinks?.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  [ {link.label.toLowerCase()} ]
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {post.projectMetadata && (
        <div className="mb-12 border-y border-border py-8 font-mono text-xs uppercase space-y-4">
          {post.projectMetadata.exhibition && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">exhibition:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.exhibition}</span>
            </div>
          )}
          {post.projectMetadata.institution && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">institution:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.institution}</span>
            </div>
          )}
          {post.projectMetadata.collaborators && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">collaborators:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.collaborators}</span>
            </div>
          )}
          {post.projectMetadata.researchArea && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">research area:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.researchArea}</span>
            </div>
          )}
          {post.projectMetadata.tools && post.projectMetadata.tools.length > 0 && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">tools:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.tools.join(", ")}</span>
            </div>
          )}
          {post.projectMetadata.technologies && post.projectMetadata.technologies.length > 0 && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">technologies:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.technologies.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      <TableOfContents content={markdownContent} />

      <div className="space-y-12">
        {post.cells.map((cell) => (
          <PostCell key={cell.id} cell={cell} />
        ))}
      </div>

      <ShareSection title={post.title} url={postUrl} />

      {post.projectMetadata?.credits && (
        <div className="mt-16 border-t border-border pt-10 font-mono text-xs uppercase space-y-4">
          <h3 className="text-sm font-semibold mb-4 text-foreground/90">[ credits ]</h3>
          {post.projectMetadata.credits.performers && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">performers:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.credits.performers}</span>
            </div>
          )}
          {post.projectMetadata.credits.cinematography && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">cinematography:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.credits.cinematography}</span>
            </div>
          )}
          {post.projectMetadata.credits.music && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">music:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.credits.music}</span>
            </div>
          )}
          {post.projectMetadata.credits.sound && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">sound design:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.credits.sound}</span>
            </div>
          )}
          {post.projectMetadata.credits.editing && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">editing:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.credits.editing}</span>
            </div>
          )}
          {post.projectMetadata.credits.institutions && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">institutions:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.credits.institutions}</span>
            </div>
          )}
          {post.projectMetadata.credits.acknowledgements && (
            <div className="border-t border-border/50 pt-4 mt-4">
              <p className="text-muted-foreground mb-2">acknowledgements:</p>
              <p className="text-foreground/80 normal-case leading-relaxed font-sans text-xs max-w-2xl">
                {post.projectMetadata.credits.acknowledgements}
              </p>
            </div>
          )}
        </div>
      )}

      {post.projectMetadata?.references && post.projectMetadata.references.length > 0 && (
        <div className="mt-12 border-t border-border pt-8 font-mono text-xs uppercase space-y-3">
          <h3 className="text-sm font-semibold mb-4 text-foreground/90">[ references ]</h3>
          {post.projectMetadata.references.map((ref, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <span className="text-muted-foreground">[{idx + 1}]</span>
              {ref.url ? (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 lowercase"
                >
                  {ref.title}
                </a>
              ) : (
                <span className="lowercase text-foreground/90">{ref.title}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {post.researchMetadata && (
        <div className="mt-12 border-t border-border pt-8">
          <CitationBlock
            title={post.title}
            authors={post.researchMetadata.authors}
            year={post.researchMetadata.publicationYear}
            venue={post.researchMetadata.venue}
            url={post.researchMetadata.pdfAttachment || (post.researchMetadata.externalLinks && post.researchMetadata.externalLinks[0]?.url)}
          />
        </div>
      )}

      {relatedWorks.length > 0 && (
        <div className="mt-20 border-t border-border pt-10">
          <h3 className="font-mono text-xs uppercase text-muted-foreground mb-6">[ related works ]</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {relatedWorks.map((work) => (
              <PostCard key={work.id} post={work} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {relatedWritings.length > 0 && (
        <div className="mt-20 border-t border-border pt-10">
          <h3 className="font-mono text-xs uppercase text-muted-foreground mb-6">[ related writings ]</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {relatedWritings.map((writing) => (
              <PostCard key={writing.id} post={writing} variant="compact" />
            ))}
          </div>
        </div>
      )}

      <div className="mt-16 border-t border-border pt-8 flex items-center justify-between font-mono text-xs uppercase">
        {prevPost ? (
          <Link href={`/post/${prevPost.id}`} className="text-primary hover:underline flex items-center gap-1">
            <span>←</span>
            <span>prev {post.type}</span>
          </Link>
        ) : (
          <span className="text-muted-foreground/50">← first one</span>
        )}

        <Link href={backLink.href} className="text-muted-foreground hover:text-foreground">
          [ all {backLink.label.toLowerCase()} ]
        </Link>

        {nextPost ? (
          <Link href={`/post/${nextPost.id}`} className="text-primary hover:underline flex items-center gap-1">
            <span>next {post.type}</span>
            <span>→</span>
          </Link>
        ) : (
          <span className="text-muted-foreground/50">last one →</span>
        )}
      </div>
    </article>
  );
}
