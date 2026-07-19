"use client";

import { useEffect, useState, use } from "react";
import { LivePostsList } from "@/components/post/live-posts-list";
import { postsApi } from "@/lib/posts-api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ type: string }>;
}

export default function CustomTypePage({ params }: Props) {
  const { type: rawType } = use(params);
  const type = decodeURIComponent(rawType);
  const [typeName, setTypeName] = useState("");

  useEffect(() => {
    // Fetch the list of content types to find the display name
    postsApi
      .listContentTypes()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const matched = res.data.find((t: any) => t.slug === type);
          if (matched) {
            setTypeName(matched.name);
          } else {
            // Capitalize fallback
            setTypeName(type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " "));
          }
        }
      })
      .catch(() => {
        // Capitalize fallback
        setTypeName(type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " "));
      });
  }, [type]);

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <section className="site-section">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground hover:text-foreground">
            <Link href="/posts">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Posts
            </Link>
          </Button>
        </div>

        <div className="section-heading">
          <p>posts</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            {typeName || type}
          </h1>
          <span className="text-xs uppercase text-muted-foreground font-mono">
            {type} / writings
          </span>
        </div>
        
        <LivePostsList
          postTypes={[type]}
          emptyMessage={`No posts published under ${typeName || type} yet.`}
        />
      </section>
    </div>
  );
}
