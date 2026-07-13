"use client";

import {
  useEffect,
  useCallback,
  useState,
  useRef,
  TouchEvent,
} from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Copy,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LightboxImage {
  id: string;
  url: string;
  alt: string;
}

interface AdvancedImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}

/* ─────────────────────────────────────────────────────────
   Named export so both ImageCell and ImageGallery can import
───────────────────────────────────────────────────────── */
export function AdvancedImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: AdvancedImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Touch gesture state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const currentImage = images[currentIndex];

  // Reset transform when navigating
  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
    setLoaded(false);
  }, []);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    resetTransform();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length, resetTransform]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    resetTransform();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length, resetTransform]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.35, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(s - 0.35, 0.5);
      if (next <= 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          setScale(1);
          setPanOffset({ x: 0, y: 0 });
          setRotation(0);
          break;
        case "r":
          handleRotate();
          break;
      }

      // Focus trap
      if (e.key === "Tab" && containerRef.current) {
        const focusable = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
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
    },
    [onClose, goNext, goPrev, handleZoomIn, handleZoomOut, handleRotate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Auto-focus on first focusable
    const timeout = setTimeout(() => {
      const btn = containerRef.current?.querySelector<HTMLElement>("button");
      btn?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      clearTimeout(timeout);
    };
  }, [handleKeyDown]);

  // Mouse pan when zoomed in
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...panOffset };
    },
    [scale, panOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPanOffset({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch swipe navigation
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // Horizontal swipe only if not zoomed in
    if (scale <= 1 && Math.abs(dx) > 50 && dy < 80) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  // Double-click zoom toggle
  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  }, [scale]);

  // Download handler
  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = currentImage.url;
    a.download = currentImage.alt || "image";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [currentImage]);

  // Copy URL handler
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentImage.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [currentImage.url]);

  // Share handler (Web Share API with clipboard fallback)
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentImage.alt || "Image",
          url: currentImage.url,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    handleCopyUrl();
  }, [currentImage, handleCopyUrl]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[300] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={currentImage.alt || "Image viewer"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/95 backdrop-blur-md cursor-zoom-out"
        onClick={onClose}
      />

      {/* Top action bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        {/* Image counter */}
        {images.length > 1 && (
          <span className="font-mono text-[10px] uppercase text-muted-foreground bg-background/80 border border-border px-2.5 py-1 backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </span>
        )}
        {images.length === 1 && <div />}

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm rounded-sm"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setScale(1); setPanOffset({ x: 0, y: 0 }); }}
            className="flex h-8 items-center justify-center border border-border/80 bg-background/90 px-2 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm rounded-sm min-w-[44px]"
            aria-label="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm rounded-sm"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <div className="w-px h-5 bg-border/60 mx-1" />

          <button
            onClick={handleRotate}
            className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm rounded-sm"
            aria-label="Rotate 90°"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCopyUrl}
            className={cn(
              "flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 transition-colors backdrop-blur-sm rounded-sm",
              copied ? "text-green-500 border-green-500/50" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Copy image URL"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm rounded-sm"
            aria-label="Share image"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <a
            href={currentImage.url}
            download={currentImage.alt || "image"}
            onClick={(e) => { e.preventDefault(); handleDownload(); }}
            className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm rounded-sm"
            aria-label="Download original image"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground hover:border-destructive/60 hover:text-destructive transition-colors backdrop-blur-sm rounded-sm"
            aria-label="Close viewer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Previous / Next navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-all backdrop-blur-sm rounded-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-all backdrop-blur-sm rounded-sm"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Image wrapper */}
      <div
        className="relative z-10 flex items-center justify-center w-full h-full p-16 overflow-hidden select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        {/* Loading spinner */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        <img
          key={currentImage.id}
          src={currentImage.url}
          alt={currentImage.alt || ""}
          onLoad={() => setLoaded(true)}
          onDoubleClick={handleDoubleClick}
          className="max-h-full max-w-full object-contain transition-all duration-200 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale}) rotate(${rotation}deg)`,
            opacity: loaded ? 1 : 0,
            transitionProperty: isDragging ? "none" : "transform, opacity",
          }}
          draggable={false}
        />
      </div>

      {/* Caption */}
      {currentImage.alt && (
        <div className="absolute bottom-12 left-0 right-0 text-center font-mono text-[10px] uppercase text-muted-foreground px-12 truncate pointer-events-none">
          {currentImage.alt}
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase text-muted-foreground/50 hidden sm:flex items-center gap-4 pointer-events-none whitespace-nowrap">
        <span><kbd className="border border-border/50 px-1">Esc</kbd> close</span>
        {images.length > 1 && <span><kbd className="border border-border/50 px-1">←→</kbd> navigate</span>}
        <span><kbd className="border border-border/50 px-1">+/-</kbd> zoom</span>
        <span><kbd className="border border-border/50 px-1">R</kbd> rotate</span>
        <span><kbd className="border border-border/50 px-1">0</kbd> reset</span>
      </div>

      {/* Copied toast */}
      {copied && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-green-500/90 text-white font-mono text-[10px] uppercase px-4 py-2 rounded shadow-lg backdrop-blur-sm">
          URL Copied!
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Legacy single-image wrapper (keeps backward compatibility
   with existing ImageCell imports)
───────────────────────────────────────────────────────── */
export function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
}) {
  return (
    <AdvancedImageLightbox
      images={[{ id: src, url: src, alt: alt || "" }]}
      initialIndex={0}
      onClose={onClose}
    />
  );
}
