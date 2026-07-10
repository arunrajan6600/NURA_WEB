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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 py-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold truncate">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {formattedDate}
        </p>
      </div>

      <Link href={`/post/${post.id}`} className="sm:ml-4 self-start sm:self-center">
        <Button variant="ghost" size="sm" className="w-full sm:w-auto">
          Read more
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
