import Image from "next/image";
import Link from "next/link";
import MatrixGridBackground from "@/components/ui/matrix-grid-background";
import { posts } from "@/data/posts";

export default function Home() {
  const projectCount = posts.filter(
    (post) => post.status === "published" && post.type === "project"
  ).length;
  const writingCount = posts.filter(
    (post) => post.status === "published" && post.type !== "project"
  ).length;

  return (
    <>
      <MatrixGridBackground
        className="block opacity-90"
        enableWaveAnimation={true}
        enableMouseHoverAnimation
        enableCardBorderAnimation
      />

      <div className="flex flex-col gap-20 md:gap-28">
        <section className="relative flex min-h-[72vh] flex-col items-center justify-center overflow-hidden py-14 text-center">
          <div className="mb-10 space-y-3 font-mono text-[11px] uppercase text-muted-foreground">
            <p>arun nura</p>
            <p>multi-disciplinary art practitioner</p>
            <p className="opacity-75 tracking-wider font-light">[{projectCount} works / {writingCount} posts compiled]</p>
          </div>

          <div className="relative flex w-full max-w-3xl flex-col items-center">
            <div className="hidden logo-pixel-frame small-logo">
              <Image
                src="/logo.svg"
                alt="Arun Nura logo placeholder"
                width={220}
                height={94}
                priority
              />
            </div>

            <div className="logo-pixel-frame large-logo">
              <Image
                src="/logo.svg"
                alt="Arun Nura logo placeholder"
                width={520}
                height={222}
                priority
              />
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 font-mono text-xs uppercase">
            <Link className="text-link" href="/works">
              works
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link className="text-link" href="/posts/blog">
              blog
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link className="text-link" href="/info">
              about
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
