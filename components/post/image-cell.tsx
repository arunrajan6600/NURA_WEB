"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { ZoomIn } from "lucide-react";

interface ImageCellProps {
  content: {
    url: string;
    alt: string;
  };
}

export function ImageCell({ content }: ImageCellProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div className="w-full space-y-2">
        <div
          className="group relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-muted/10 border border-border/50 cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
          role="button"
          tabIndex={0}
          aria-label={`View ${content.alt || "image"} fullscreen`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setLightboxOpen(true);
            }
          }}
        >
          <Image
            src={content.url}
            alt={content.alt}
            fill
            className="object-cover transition-all duration-300 group-hover:scale-[1.01] group-hover:opacity-90"
            sizes="(min-width: 1280px) 1200px, (min-width: 780px) 720px, 100vw"
            loading="lazy"
          />
          {/* Zoom hint overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/20 backdrop-blur-[1px]">
            <div className="flex items-center gap-1.5 bg-background/90 border border-border px-2.5 py-1.5 font-mono text-[10px] uppercase text-muted-foreground">
              <ZoomIn className="h-3 w-3" />
              view fullscreen
            </div>
          </div>
        </div>
        {content.alt && (
          <p className="text-xs text-muted-foreground italic font-mono lowercase">
            fig. {content.alt}
          </p>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          src={content.url}
          alt={content.alt}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
