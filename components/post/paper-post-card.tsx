"use client";

import { Post } from "@/types/post";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PaperPostCardProps {
  post: Post;
}

export function PaperPostCard({ post }: PaperPostCardProps) {
  const formattedDate = formatDistance(new Date(post.updatedAt), new Date(), {
    addSuffix: true,
  });

  return (
    <div className="flex flex-col gap-3 border border-border bg-card/70 px-4 py-4 transition-colors hover:border-primary/70 hover:bg-card sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-base font-medium uppercase leading-snug truncate">
          {post.title}
        </h3>
        <p className="mt-1 font-meta text-xs uppercase text-muted-foreground">
          {formattedDate}
        </p>
      </div>

      <Link href={`/post/${post.id}`} className="sm:ml-4 self-start sm:self-center flex-shrink-0">
        <Button variant="ghost" size="sm" className="w-full sm:w-auto">
          Read more
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
