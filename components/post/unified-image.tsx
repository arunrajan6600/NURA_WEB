"use client";

import { useState } from "react";
import { ZoomIn } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils";

interface UnifiedImageProps {
  src: string;
  alt?: string;
  className?: string;
  onLightboxOpen?: () => void;
}

export function UnifiedImage({
  src,
  alt,
  className,
  onLightboxOpen,
}: UnifiedImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleClick = () => {
    if (onLightboxOpen) {
      onLightboxOpen();
    } else {
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <div className={cn("w-full space-y-2", className)}>
        <div
          onClick={handleClick}
          className="group relative w-full overflow-hidden rounded-xl border border-border/10 bg-muted/5 shadow-xl cursor-zoom-in transition-all duration-300 hover:border-primary/40"
          role="button"
          tabIndex={0}
          aria-label={alt ? `View ${alt} fullscreen` : "View image fullscreen"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          {/* Main Image */}
          <img
            src={src}
            alt={alt || ""}
            loading="lazy"
            className="w-full h-auto object-contain transition-all duration-500 group-hover:scale-[1.015]"
          />

          {/* Zoom Overlay Hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[1px] pointer-events-none">
            <div className="flex items-center gap-1.5 bg-background/90 border border-border px-3 py-1.5 font-display text-[10px] uppercase text-muted-foreground tracking-wider rounded shadow-md pointer-events-auto">
              <ZoomIn className="h-3 w-3" />
              view fullscreen
            </div>
          </div>
        </div>

        {/* Unified Caption */}
        {alt && (
          <p className="text-xs text-muted-foreground italic font-display lowercase mt-2 pl-0.5">
            fig. {alt}
          </p>
        )}
      </div>

      {lightboxOpen && !onLightboxOpen && (
        <ImageLightbox
          src={src}
          alt={alt}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

