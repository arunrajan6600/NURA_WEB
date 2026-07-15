import { notFound } from "next/navigation";
import { posts } from "@/data/posts";
import { PostCell } from "@/components/post/post-cell";
import { PostCard } from "@/components/post/post-card";
import { formatDistance, format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, ImageIcon, Video } from "lucide-react";
import { Metadata } from "next";
import { Post } from "@/types/post";
import { CitationBlock } from "@/components/post/citation-block";
import { TableOfContents } from "@/components/post/table-of-contents";
import { ShareSection } from "@/components/post/share-section";
import { groupCells, getMediaCounts } from "@/lib/media-grouper";
import { MarkdownCell } from "@/components/post/markdown-cell";
import { postsApi } from "@/lib/posts-api";

interface Props {
  params: Promise<{ id: string }>;
}

async function getPost(id: string): Promise<Post | undefined> {
  if (id === "placeholder") return undefined;
  
  try {
    const res = await postsApi.getPost(id);
    if (res.success && res.data) {
      return res.data as Post;
    }
  } catch (error: any) {
    console.error(`Error fetching post ${id} from live API:`, error);
    
    // Check if error is an explicit 404 (not found)
    const errorMsg = error?.message || "";
    if (
      errorMsg.toLowerCase().includes("not found") || 
      errorMsg.includes("404")
    ) {
      return undefined;
    }
  }
  
  // Fallback to static posts only if the API is offline/unavailable
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
const getRelatedWorks = (currentPost: Post, postsList: Post[], count = 3) => {
  if (currentPost.type !== "project") return [];

  const candidates = postsList.filter(
    (p) =>
      p.status === "published" &&
      p.type === "project" &&
      p.id !== currentPost.id &&
      p.archived !== true
  );

  const getTags = (p: Post) => {
    if (p.tags && p.tags.length > 0) {
      return new Set(p.tags.map((t) => t.toLowerCase()));
    }
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
  const currentTechs = new Set(currentPost.projectMetadata?.technologies?.map((t) => t.toLowerCase()) || []);
  const currentCategory = currentPost.projectMetadata?.category?.toLowerCase();

  const scored = candidates.map((p) => {
    let score = 0;

    // Match category
    const pCategory = p.projectMetadata?.category?.toLowerCase();
    if (currentCategory && pCategory && currentCategory === pCategory) {
      score += 5;
    }

    // Match medium
    if (
      currentPost.projectMetadata?.medium &&
      p.projectMetadata?.medium &&
      currentPost.projectMetadata.medium.toLowerCase() ===
        p.projectMetadata.medium.toLowerCase()
    ) {
      score += 2;
    }

    // Match tags
    const pTags = getTags(p);
    pTags.forEach((tag) => {
      if (currentTags.has(tag)) score += 3;
    });

    // Match technologies
    const pTechs = p.projectMetadata?.technologies?.map((t) => t.toLowerCase()) || [];
    pTechs.forEach((tech) => {
      if (currentTechs.has(tech)) score += 3;
    });

    // Match year
    if (
      currentPost.projectMetadata?.year &&
      p.projectMetadata?.year &&
      currentPost.projectMetadata.year === p.projectMetadata.year
    ) {
      score += 3;
    }

    return { post: p, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.post);
};

// Helper to retrieve related writings based on type/tags match
const getRelatedWritings = (currentPost: Post, postsList: Post[], count = 2) => {
  if (currentPost.type === "project") return [];

  const candidates = postsList.filter(
    (p) =>
      p.status === "published" &&
      p.type !== "project" &&
      p.id !== currentPost.id &&
      p.archived !== true
  );

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
  const post = await getPost(resolvedId);

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
  
  const post = await getPost(resolvedId);

  if (!post || post.status !== "published") {
    notFound();
  }

  const formattedDate = format(new Date(post.updatedAt), "MMMM d, yyyy");
  const backLink = getBackLink(post);

  // Fetch all published posts from live API to resolve dynamic routing & relations
  let allPublishedPosts: Post[] = [];
  try {
    const res = await postsApi.listPosts({ status: "published" });
    if (res.success && Array.isArray(res.data)) {
      allPublishedPosts = res.data as Post[];
    }
  } catch (error) {
    console.error("Error fetching published posts list from live API:", error);
  }
  if (allPublishedPosts.length === 0) {
    allPublishedPosts = posts.filter((p) => p.status === "published") as Post[];
  }

  // Navigation sequencing
  const sameTypePosts = allPublishedPosts.filter((p) => p.type === post.type);
  const currentIndex = sameTypePosts.findIndex((p) => p.id === post.id);
  const prevPost = currentIndex > 0 ? sameTypePosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex >= 0 && currentIndex < sameTypePosts.length - 1
      ? sameTypePosts[currentIndex + 1]
      : null;

  // Retrieve related works
  const relatedWorks = getRelatedWorks(post, allPublishedPosts, 3);
  const relatedWritings = getRelatedWritings(post, allPublishedPosts, 2);

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
    <article className={`${post.type === "project" ? "max-w-5xl" : "max-w-4xl"} mx-auto py-8 px-4`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Button variant="ghost" className="mb-8 font-mono text-xs uppercase" asChild>
        <Link href={backLink.href}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {backLink.label}
        </Link>
      </Button>

      {/* Hero Header Section */}
      {post.type === "project" && post.thumbnail?.url ? (
        <div className="w-full relative h-[45vh] sm:h-[55vh] min-h-[350px] overflow-hidden rounded-lg mb-12 bg-muted/10">
          <img
            src={post.thumbnail.url}
            alt={post.thumbnail.alt || post.title}
            className="w-full h-full object-cover brightness-[0.7] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/35 to-transparent flex flex-col justify-end p-6 sm:p-10 space-y-4">
            {post.projectMetadata?.category && (
              <span className="font-mono text-xs uppercase bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-sm w-fit tracking-wider">
                {post.projectMetadata.category}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {post.title}
            </h1>
            {post.projectMetadata?.subtitle && (
              <p className="text-lg sm:text-xl text-zinc-300 italic max-w-3xl leading-relaxed">
                {post.projectMetadata.subtitle}
              </p>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/15 backdrop-blur-sm border border-white/20 px-2 py-0.5 font-mono text-[9px] uppercase text-zinc-250 rounded-sm text-zinc-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            {post.title}
          </h1>
          {post.projectMetadata?.subtitle && (
            <p className="text-xl text-muted-foreground italic leading-relaxed">
              {post.projectMetadata.subtitle}
            </p>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-border/80 px-2 py-0.5 font-mono text-[9px] uppercase text-muted-foreground rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground font-mono uppercase">
            <span suppressHydrationWarning>Updated {formattedDate}</span>
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
          {/* Media stats — shown when post contains images or videos */}
          {(() => {
            const { imagesCount, videosCount } = getMediaCounts(post.cells);
            if (imagesCount === 0 && videosCount === 0) return null;
            return (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {imagesCount > 0 && (
                  <span className="flex items-center gap-1.5 border border-border/60 bg-muted/30 px-2.5 py-1 font-mono text-[10px] uppercase text-muted-foreground rounded-sm">
                    <ImageIcon className="h-2.5 w-2.5" />
                    {imagesCount} {imagesCount === 1 ? "image" : "images"}
                  </span>
                )}
                {videosCount > 0 && (
                  <span className="flex items-center gap-1.5 border border-border/60 bg-muted/30 px-2.5 py-1 font-mono text-[10px] uppercase text-muted-foreground rounded-sm">
                    <Video className="h-2.5 w-2.5" />
                    {videosCount} {videosCount === 1 ? "video" : "videos"}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}

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
          {post.projectMetadata.category && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">category:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.category}</span>
            </div>
          )}
          {post.projectMetadata.role && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">role:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.role}</span>
            </div>
          )}
          {post.projectMetadata.client && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">client:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.client}</span>
            </div>
          )}
          {post.projectMetadata.teamMembers && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="text-muted-foreground">team members:</span>
              <span className="lowercase text-foreground/90">{post.projectMetadata.teamMembers}</span>
            </div>
          )}
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

          {/* Project links & Publication info */}
          {((post.projectMetadata.repoLink || post.projectMetadata.demoLink || post.projectMetadata.docLink || post.projectMetadata.publication)) && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-border mt-4">
              {post.projectMetadata.repoLink && (
                <a
                  href={post.projectMetadata.repoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 lowercase"
                >
                  [ repository ]
                </a>
              )}
              {post.projectMetadata.demoLink && (
                <a
                  href={post.projectMetadata.demoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 lowercase"
                >
                  [ live demo ]
                </a>
              )}
              {post.projectMetadata.docLink && (
                <a
                  href={post.projectMetadata.docLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 lowercase"
                >
                  [ documentation ]
                </a>
              )}
              {post.projectMetadata.publication && (
                <div className="lowercase text-foreground/90 lowercase">
                  [ publication: {post.projectMetadata.publication} ]
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10 mt-12 items-start">
        {/* Main Content Area */}
        <div className="space-y-12 min-w-0">
          <div className="space-y-12">
            {groupCells(post.cells).map((cell) => (
              <PostCell key={cell.id} cell={cell} />
            ))}
          </div>

          {/* Render custom project sections */}
          {post.projectMetadata?.sections && post.projectMetadata.sections.length > 0 && (
            <div className="space-y-16 border-t border-border/60 pt-16">
              {post.projectMetadata.sections
                .sort((a, b) => a.order - b.order)
                .map((sec) => (
                  <section key={sec.id} id={`section-${sec.id}`} className="space-y-4 scroll-mt-20">
                    <h3 className="text-xl font-bold tracking-tight text-foreground font-mono lowercase border-b border-border/40 pb-2">
                      [ {sec.title} ]
                    </h3>
                    <div className="text-muted-foreground leading-relaxed">
                      <MarkdownCell content={sec.content} />
                    </div>
                  </section>
                ))}
            </div>
          )}
        </div>

        {/* Sticky Sidebar (TOC) */}
        {post.projectMetadata?.sections && post.projectMetadata.sections.length > 0 && (
          <aside className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto border-l border-border/40 pl-5 space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold">Sections</h4>
            <nav className="space-y-2.5 font-mono text-[11px] uppercase" aria-label="Project sections navigation">
              {post.projectMetadata.sections
                .sort((a, b) => a.order - b.order)
                .map((sec) => (
                  <a
                    key={sec.id}
                    href={`#section-${sec.id}`}
                    className="block text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                  >
                    // {sec.title}
                  </a>
                ))}
            </nav>
          </aside>
        )}
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
          <div className="grid gap-6 md:grid-cols-3">
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
