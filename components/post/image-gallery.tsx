"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AdvancedImageLightbox } from "@/components/ui/image-lightbox";

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
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  }, []);

  const handleOpen = useCallback((idx: number) => {
    setLightboxIndex(idx);
  }, []);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  if (!images || images.length === 0) return null;

  // Single image — keep full width
  if (images.length === 1) {
    const img = images[0];
    return (
      <>
        <div
          className="group relative w-full overflow-hidden rounded-lg border border-border/40 bg-muted/20 cursor-zoom-in aspect-[3/2] shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30"
          onClick={() => handleOpen(0)}
          role="button"
          tabIndex={0}
          aria-label={`View ${img.alt || "image"} fullscreen`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpen(0);
            }
          }}
        >
          {/* Skeleton placeholder */}
          {!loadedImages.has(img.id) && (
            <div className="absolute inset-0 animate-pulse bg-muted/50" />
          )}
          <img
            src={img.url}
            alt={img.alt || ""}
            loading="lazy"
            onLoad={() => handleImageLoad(img.id)}
            className={cn(
              "h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.02]",
              loadedImages.has(img.id) ? "opacity-100 blur-0" : "opacity-0 blur-sm"
            )}
          />
          {/* Zoom hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="rounded bg-background/90 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm">
              View Fullscreen
            </div>
          </div>
        </div>
        {img.alt && (
          <p className="mt-1.5 text-xs text-muted-foreground italic font-mono lowercase">
            fig. {img.alt}
          </p>
        )}

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

  // Multiple images — CSS masonry columns
  const columnClass =
    images.length === 2
      ? "columns-1 sm:columns-2"
      : images.length === 3
      ? "columns-1 sm:columns-2 lg:columns-3"
      : "columns-1 sm:columns-2 lg:columns-3";

  return (
    <>
      {/* Image count bar */}
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase text-muted-foreground mb-3">
        <div className="h-px flex-1 bg-border/50" />
        <span>{images.length} images</span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <div className={cn(columnClass, "gap-4 space-y-4")}>
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="break-inside-avoid mb-4"
          >
            <div
              className="group relative w-full overflow-hidden rounded-lg border border-border/40 bg-muted/20 cursor-zoom-in shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30"
              onClick={() => handleOpen(idx)}
              role="button"
              tabIndex={0}
              aria-label={`View ${img.alt || `image ${idx + 1}`} fullscreen`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpen(idx);
                }
              }}
            >
              {/* Skeleton placeholder */}
              {!loadedImages.has(img.id) && (
                <div className="w-full min-h-[120px] animate-pulse bg-muted/50 rounded-lg" />
              )}
              <img
                src={img.url}
                alt={img.alt || ""}
                loading="lazy"
                onLoad={() => handleImageLoad(img.id)}
                className={cn(
                  "w-full object-cover transition-all duration-500 group-hover:scale-[1.02]",
                  loadedImages.has(img.id) ? "opacity-100 blur-0" : "opacity-0 blur-sm absolute inset-0 h-full"
                )}
              />
              {/* Index badge */}
              <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white/80 select-none backdrop-blur-sm">
                {idx + 1}
              </div>
              {/* Zoom hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="rounded bg-background/90 border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider backdrop-blur-sm">
                  View
                </div>
              </div>
            </div>
            {img.alt && (
              <p className="mt-1 text-[10px] text-muted-foreground italic font-mono lowercase px-0.5">
                fig. {img.alt}
              </p>
            )}
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
