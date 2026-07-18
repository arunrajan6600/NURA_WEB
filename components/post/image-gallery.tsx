"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AdvancedImageLightbox } from "@/components/ui/image-lightbox";
import { UnifiedImage } from "./unified-image";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleOpen = useCallback((idx: number) => {
    setLightboxIndex(idx);
  }, []);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  if (!images || images.length === 0) return null;

  // Single image — keep full width using UnifiedImage directly
  if (images.length === 1) {
    const img = images[0];
    return (
      <>
        <UnifiedImage
          src={img.url}
          alt={img.alt}
          onLightboxOpen={() => handleOpen(0)}
        />

        {lightboxIndex !== null && (
          <AdvancedImageLightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={handleClose}
          />
        )}
      </>
    );
  }

  // Multiple images — CSS masonry columns using UnifiedImage inside the grid
  const columnClass =
    images.length === 2
      ? "columns-1 sm:columns-2"
      : images.length === 3
      ? "columns-1 sm:columns-2 lg:columns-3"
      : "columns-1 sm:columns-2 lg:columns-3";

  return (
    <>
      {/* Image count bar */}
      <div className="flex items-center gap-3 font-display text-[10px] uppercase text-muted-foreground mb-3">
        <div className="h-px flex-1 bg-border/50" />
        <span>{images.length} images</span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <div className={cn(columnClass, "gap-4 space-y-4")}>
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="break-inside-avoid mb-4 relative"
          >
            <UnifiedImage
              src={img.url}
              alt={img.alt}
              onLightboxOpen={() => handleOpen(idx)}
            />
            {/* Index badge overlay */}
            <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-display text-[9px] text-white/85 select-none backdrop-blur-sm pointer-events-none">
              {idx + 1}
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <AdvancedImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={handleClose}
        />
      )}
    </>
  );
}
