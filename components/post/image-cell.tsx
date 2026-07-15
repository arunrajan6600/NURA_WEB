"use client";

import { UnifiedImage } from "./unified-image";

interface ImageCellProps {
  content: {
    url: string;
    alt: string;
  };
}

export function ImageCell({ content }: ImageCellProps) {
  if (!content?.url) return null;
  return <UnifiedImage src={content.url} alt={content.alt} />;
}
