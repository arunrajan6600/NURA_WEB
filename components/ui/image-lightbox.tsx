"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 3));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.5));
      if (e.key === "0") setScale(1);

      // Focus trap
      if (e.key === "Tab" && containerRef.current) {
        const focusable = Array.from(
          containerRef.current.querySelectorAll(
            'button:not([disabled]), a[href], [tabIndex="0"]:not([tabIndex="-1"])'
          )
        ) as HTMLElement[];
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Focus close button or first focusable element on mount
    if (containerRef.current) {
      const focusable = containerRef.current.querySelectorAll('button, a, [tabIndex="0"]');
      const closeBtn = Array.from(focusable).find(
        (el) => el.getAttribute("aria-label") === "Close viewer"
      );
      if (closeBtn) {
        (closeBtn as HTMLElement).focus();
      } else if (focusable.length > 0) {
        (focusable[0] as HTMLElement).focus();
      }
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Image viewer"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/95 backdrop-blur-sm cursor-zoom-out"
        onClick={onClose}
      />

      {/* Controls bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
          className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setScale(1)}
          className="flex h-8 items-center justify-center border border-border/80 bg-background/90 px-2 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
          className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <a
          href={src && (src.startsWith('http') || src.startsWith('https')) ? (src.includes('?') ? `${src}&download=` : `${src}?download=`) : src}
          download
          className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Download image"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close viewer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Image wrapper */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-8 overflow-auto">
        {/* Loading placeholder */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <img
          src={src}
          alt={alt || ""}
          className="max-h-full max-w-full object-contain select-none transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${scale})`,
            opacity: loaded ? 1 : 0,
            cursor: scale > 1 ? "zoom-out" : "zoom-in",
          }}
          onClick={() =>
            setScale((s) => (s === 1 ? 1.75 : 1))
          }
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
      </div>

      {/* Caption */}
      {alt && (
        <div className="absolute bottom-4 left-0 right-0 text-center font-mono text-[10px] uppercase text-muted-foreground px-8">
          {alt}
        </div>
      )}

      {/* Keyboard hints */}
      <div className="absolute bottom-4 right-4 font-mono text-[9px] uppercase text-muted-foreground/50 hidden sm:flex items-center gap-3">
        <span><kbd className="border border-border/50 px-1">Esc</kbd> close</span>
        <span><kbd className="border border-border/50 px-1">+/-</kbd> zoom</span>
        <span><kbd className="border border-border/50 px-1">0</kbd> reset</span>
      </div>
    </div>
  );
}
