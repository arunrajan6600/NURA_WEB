"use client";

import Image from "next/image";

interface ImageCellProps {
  content: {
    url: string;
    alt: string;
  };
}

export function ImageCell({ content }: ImageCellProps) {
  return (
    <div className="w-full space-y-2">
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-muted/10 border border-border/50">
        <Image
          src={content.url}
          alt={content.alt}
          fill
          className="object-cover transition-opacity duration-300 hover:opacity-95"
          sizes="(min-width: 1280px) 1200px, (min-width: 780px) 720px, 100vw"
        />
      </div>
      {content.alt && (
        <p className="text-xs text-muted-foreground italic font-mono lowercase">
          fig. {content.alt}
        </p>
      )}
    </div>
  );
}
