"use client";

import { useState, useEffect } from "react";
import { Post } from "@/types/post";
import { postsApi } from "@/lib/posts-api";
import { PostCell } from "@/components/post/post-cell";
import { PostCard } from "@/components/post/post-card";
import { PostDetailDates } from "./post-dates";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { CitationBlock } from "@/components/post/citation-block";
import { ShareSection } from "@/components/post/share-section";
import { groupCells } from "@/lib/media-grouper";
import { MarkdownCell } from "@/components/post/markdown-cell";
import { ProjectLinks } from "@/components/post/project-links";
import { ProjectCredits } from "@/components/post/project-credits";

// ─── Helpers (ported from [id]/page.tsx) ──────────────────────────────────────

function getBackLink(post: Post) {
  switch (post.type) {
    case "project":
      return { href: "/works", label: "Works" };
    case "paper":
    case "article": // legacy backward compatibility
      return { href: "/posts/papers", label: "Articles & Papers" };
    case "story":
      return { href: "/posts/stories", label: "Stories" };
    case "general":
      return { href: "/posts/general", label: "Other Writings" };
    case "blog":
      return { href: "/posts/blog", label: "Blog" };
    default:
      // Custom content types link back to the posts hub
      return { href: "/posts", label: "Posts" };
  }
}

function getRelatedWorks(currentPost: Post, postsList: Post[], count = 3) {
  if (currentPost.type !== "project") return [];
  const candidates = postsList.filter(
    (p) =>
      p.status === "published" &&
      p.type === "project" &&
      p.id !== currentPost.id &&
      p.archived !== true
  );
  const getTags = (p: Post) => {
    if (p.tags && p.tags.length > 0)
      return new Set(p.tags.map((t) => t.toLowerCase()));
    const tags = new Set<string>();
    const text = [p.title, p.excerpt ?? ""].join(" ").toLowerCase();
    if (p.cells.some((c) => c.type === "video") || text.includes("video"))
      tags.add("video");
    if (p.thumbnail || p.cells.some((c) => c.type === "image")) tags.add("image");
    if (/\b(ai|yolo|model|embedding|chatgpt)\b/.test(text)) tags.add("ai");
    if (/\b(interactive|controlled|touchdesigner|vcv|api|sensor)\b/.test(text))
      tags.add("interactive");
    if (/\b(code|python|shader|api)\b/.test(text)) tags.add("code");
    return tags;
  };
  const currentTags = getTags(currentPost);
  const currentTechs = new Set(
    currentPost.projectMetadata?.technologies?.map((t) => t.toLowerCase()) || []
  );
  const currentCategory = currentPost.projectMetadata?.category?.toLowerCase();
  const scored = candidates.map((p) => {
    let score = 0;
    const pCategory = p.projectMetadata?.category?.toLowerCase();
    if (currentCategory && pCategory && currentCategory === pCategory) score += 5;
    if (
      currentPost.projectMetadata?.medium &&
      p.projectMetadata?.medium &&
      currentPost.projectMetadata.medium.toLowerCase() ===
        p.projectMetadata.medium.toLowerCase()
    )
      score += 2;
    const pTags = getTags(p);
    pTags.forEach((tag) => { if (currentTags.has(tag)) score += 3; });
    const pTechs = p.projectMetadata?.technologies?.map((t) => t.toLowerCase()) || [];
    pTechs.forEach((tech) => { if (currentTechs.has(tech)) score += 3; });
    if (
      currentPost.projectMetadata?.year &&
      p.projectMetadata?.year &&
      currentPost.projectMetadata.year === p.projectMetadata.year
    )
      score += 3;
    return { post: p, score };
  });
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.post);
}

function getRelatedWritings(currentPost: Post, postsList: Post[], count = 2) {
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
    if (currentPost.type === p.type) score += 4;
    const pTags = getTags(p);
    pTags.forEach((tag) => { if (currentTags.has(tag)) score += 1; });
    return { post: p, score };
  });
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.post);
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-pulse space-y-8">
      <div className="h-8 w-24 bg-muted/30 rounded" />
      <div className="w-full h-[45vh] bg-muted/20 rounded-lg" />
      <div className="space-y-4">
        <div className="h-10 w-2/3 bg-muted/30 rounded" />
        <div className="h-4 w-1/3 bg-muted/20 rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full bg-muted/15 rounded" />
        <div className="h-3 w-5/6 bg-muted/15 rounded" />
        <div className="h-3 w-4/6 bg-muted/15 rounded" />
      </div>
    </div>
  );
}

// ─── Not-found inline state ────────────────────────────────────────────────────

function PostNotFound() {
  return (
    <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-6">
      <p className="font-display text-xs uppercase text-muted-foreground tracking-widest">
        404 — post not found
      </p>
      <h1 className="text-3xl font-bold">This post doesn&apos;t exist</h1>
      <p className="text-muted-foreground">
        It may have been removed, unpublished, or the URL is incorrect.
      </p>
      <div className="flex justify-center gap-4 pt-4">
        <Button variant="ghost" asChild>
          <Link href="/works">← Works</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface PostDetailClientProps {
  postId: string;
}

export function PostDetailClient({ postId }: PostDetailClientProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [allPublishedPosts, setAllPublishedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // Fetch the specific post
  useEffect(() => {
    if (!postId || postId === "placeholder") {
      setIsNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const res = await postsApi.getPost(postId);
        if (cancelled) return;
        if (res.success && res.data) {
          const fetchedPost = res.data as Post;
          if (fetchedPost.status !== "published") {
            setIsNotFound(true);
          } else {
            setPost(fetchedPost);
            // Update page title client-side
            document.title = `${fetchedPost.title} | Arun Nura`;
          }
        } else {
          setIsNotFound(true);
        }
      } catch {
        if (!cancelled) setIsNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [postId]);

  // Fetch all published posts for navigation / related content
  useEffect(() => {
    async function loadAll() {
      try {
        const res = await postsApi.listPosts({ status: "published" });
        if (res.success && Array.isArray(res.data)) {
          setAllPublishedPosts(res.data as Post[]);
        }
      } catch {
        // silent — navigation and related sections will just be empty
      }
    }
    loadAll();
  }, []);

  if (loading) return <PostDetailSkeleton />;
  if (isNotFound || !post) return <PostNotFound />;

  // ── Derived values ─────────────────────────────────────────────────────────

  const backLink = getBackLink(post);

  const sameTypePosts = allPublishedPosts.filter((p) => p.type === post.type);
  const currentIndex = sameTypePosts.findIndex((p) => p.id === post.id);
  const prevPost = currentIndex > 0 ? sameTypePosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex >= 0 && currentIndex < sameTypePosts.length - 1
      ? sameTypePosts[currentIndex + 1]
      : null;

  const relatedWorks = getRelatedWorks(post, allPublishedPosts, 3);
  const relatedWritings = getRelatedWritings(post, allPublishedPosts, 2);

  const allText = post.cells
    .map((c) => (typeof c.content === "string" ? c.content : JSON.stringify(c.content ?? "")))
    .join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const markdownContent = post.cells
    .filter((c) => c.type === "markdown")
    .map((c) => (typeof c.content === "string" ? c.content : ""))
    .join("\n\n");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://arunrajan6600.github.io/nuraweb";
  const postUrl = `${siteUrl}/post/${post.id}`;

  const schema =
    post.type === "project"
      ? {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: post.title,
          headline: post.title,
          description: post.excerpt || `Project by Arun Nura: ${post.title}`,
          creator: { "@type": "Person", name: "Arun Nura", url: siteUrl },
          dateCreated: post.createdAt,
          dateModified: post.updatedAt,
          image: post.thumbnail?.url ? [post.thumbnail.url] : [],
        }
      : {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt || `Article by Arun Nura: ${post.title}`,
          datePublished: post.createdAt,
          dateModified: post.updatedAt,
          author: { "@type": "Person", name: "Arun Nura", url: siteUrl },
          image: post.thumbnail?.url ? [post.thumbnail.url] : [],
        };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <article className={`${post.type === "project" ? "max-w-5xl" : "max-w-4xl"} mx-auto py-8 px-4`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Button variant="ghost" className="mb-8 font-display text-xs uppercase" asChild>
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
              <span className="font-display text-xs uppercase bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-sm w-fit tracking-wider">
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
                    className="bg-white/15 backdrop-blur-sm border border-white/20 px-2 py-0.5 font-display text-[9px] uppercase text-zinc-200 rounded-sm"
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
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">{post.title}</h1>
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
                  className="border border-border/80 px-2 py-0.5 font-display text-[9px] uppercase text-muted-foreground rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {(() => {
            const metaParts = [];
            if (post.type !== "project") {
              metaParts.push(
                <span key="reading-time" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readingMinutes} min read
                </span>
              );
            }
            if (post.projectMetadata?.year) {
              metaParts.push(
                <span key="year" className="text-foreground/80">{post.projectMetadata.year}</span>
              );
            }
            if (post.projectMetadata?.medium) {
              metaParts.push(
                <span key="medium" className="text-foreground/80">{post.projectMetadata.medium}</span>
              );
            }
            if (post.projectMetadata?.duration) {
              metaParts.push(
                <span key="duration" className="text-foreground/80">{post.projectMetadata.duration}</span>
              );
            }

            if (metaParts.length === 0) return null;

            return (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground font-display uppercase">
                {metaParts.reduce((acc, part, index) => {
                  if (index === 0) return [part];
                  return [...acc, <span key={`sep-${index}`}>/</span>, part];
                }, [] as React.ReactNode[])}
              </div>
            );
          })()}

        </div>
      )}

      <PostDetailDates post={post} />

      {/* Research Metadata */}
      {post.researchMetadata && (
        <div className="mb-12 border-y border-border py-8 font-display text-xs uppercase space-y-4">
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
          {((post.researchMetadata.externalLinks && post.researchMetadata.externalLinks.length > 0) ||
            post.researchMetadata.pdfAttachment) && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-border mt-4">
              {post.researchMetadata.pdfAttachment && (
                <a href={post.researchMetadata.pdfAttachment} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                  [ read pdf ]
                </a>
              )}
              {post.researchMetadata.externalLinks?.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                  [ {link.label.toLowerCase()} ]
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Project Metadata */}
      {post.projectMetadata && (
        <div className="mb-12 border-y border-border py-8 font-display text-xs uppercase space-y-4">
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
          <ProjectLinks pm={post.projectMetadata} />
        </div>
      )}

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10 mt-12 items-start">
        <div className="space-y-12 min-w-0">
          <div className="space-y-12">
            {groupCells(post.cells).map((cell) => (
              <PostCell key={cell.id} cell={cell} />
            ))}
          </div>

          {post.projectMetadata?.sections && post.projectMetadata.sections.length > 0 && (
            <div className="space-y-16 border-t border-border/60 pt-16">
              {post.projectMetadata.sections
                .sort((a, b) => a.order - b.order)
                .map((sec) => (
                  <section key={sec.id} id={`section-${sec.id}`} className="space-y-4 scroll-mt-20">
                    <h3 className="text-xl font-bold tracking-tight text-foreground font-display lowercase border-b border-border/40 pb-2">
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

        {post.projectMetadata?.sections && post.projectMetadata.sections.length > 0 && (
          <aside className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto border-l border-border/40 pl-5 space-y-4">
            <h4 className="font-display text-xs uppercase tracking-wider text-muted-foreground font-bold">Sections</h4>
            <nav className="space-y-2.5 font-display text-[11px] uppercase" aria-label="Project sections navigation">
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

      {/* Credits */}
      <ProjectCredits pm={post.projectMetadata} />

      {/* References */}
      {post.projectMetadata?.references && post.projectMetadata.references.length > 0 && (
        <div className="mt-12 border-t border-border pt-8 font-display text-xs uppercase space-y-3">
          <h3 className="text-sm font-semibold mb-4 text-foreground/90">[ references ]</h3>
          {post.projectMetadata.references.map((ref: { url?: string; title: string }, idx: number) => (
            <div key={idx} className="flex items-start gap-4">
              <span className="text-muted-foreground">[{idx + 1}]</span>
              {ref.url ? (
                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 lowercase">
                  {ref.title}
                </a>
              ) : (
                <span className="lowercase text-foreground/90">{ref.title}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Citation Block */}
      {post.researchMetadata && (
        <div className="mt-12 border-t border-border pt-8">
          <CitationBlock
            title={post.title}
            authors={post.researchMetadata.authors}
            year={post.researchMetadata.publicationYear}
            venue={post.researchMetadata.venue}
            url={
              post.researchMetadata.pdfAttachment ||
              (post.researchMetadata.externalLinks && post.researchMetadata.externalLinks[0]?.url)
            }
          />
        </div>
      )}

      {/* Related Works */}
      {relatedWorks.length > 0 && (
        <div className="mt-20 border-t border-border pt-10">
          <h3 className="font-display text-xs uppercase text-muted-foreground mb-6">[ related works ]</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedWorks.map((work) => (
              <PostCard key={work.id} post={work} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* Related Writings */}
      {relatedWritings.length > 0 && (
        <div className="mt-20 border-t border-border pt-10">
          <h3 className="font-display text-xs uppercase text-muted-foreground mb-6">[ related writings ]</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {relatedWritings.map((writing) => (
              <PostCard key={writing.id} post={writing} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div className="mt-16 border-t border-border pt-8 flex items-center justify-between font-display text-xs uppercase">
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

