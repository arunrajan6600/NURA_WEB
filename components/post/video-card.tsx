"use client";

import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";
import { VideoPlayer } from "./video-player";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  url: string;
  title?: string;
  onTheatreToggle?: () => void;
  isTheatreMode?: boolean;
}

function getVideoProvider(url: string): "youtube" | "vimeo" | "direct" {
  if (!url || typeof url !== "string") return "direct";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  return "direct";
}

function getEmbedUrl(
  url: string,
  provider: "youtube" | "vimeo" | "direct",
  autoplay = false
): string {
  if (provider === "youtube") {
    const videoId = url.includes("youtube.com/watch")
      ? new URL(url).searchParams.get("v")
      : url.split("youtu.be/")[1]?.split(/[?&]/)[0];
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${
      autoplay ? 1 : 0
    }&modestbranding=1&rel=0`;
  }
  if (provider === "vimeo") {
    const videoId = url.split("vimeo.com/")[1]?.split(/[?&]/)[0];
    return `https://player.vimeo.com/video/${videoId}?autoplay=${
      autoplay ? 1 : 0
    }&dnt=1`;
  }
  return url;
}

export function VideoCard({
  url,
  title,
  onTheatreToggle,
  isTheatreMode = false,
}: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [vimeoThumbnail, setVimeoThumbnail] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const provider = getVideoProvider(url);

  // Detect mobile device to disable hover preview
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch Vimeo thumbnail and duration via Vimeo API
  useEffect(() => {
    if (provider !== "vimeo") return;
    const vimeoId = url.split("vimeo.com/")[1]?.split(/[?&]/)[0];
    if (!vimeoId) return;

    fetch(`https://vimeo.com/api/v2/video/${vimeoId}.json`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (
          Array.isArray(data) &&
          data[0] &&
          typeof data[0] === "object"
        ) {
          const item = data[0] as Record<string, unknown>;
          if (
            typeof item.thumbnail_large === "string" ||
            typeof item.thumbnail_medium === "string"
          ) {
            setVimeoThumbnail(
              (item.thumbnail_large as string) ||
                (item.thumbnail_medium as string)
            );
          }
          if (typeof item.duration === "number") {
            setDuration(item.duration);
          }
        }
      })
      .catch(() => {
        // Silently fail — thumbnail stays blank
      });
  }, [url, provider]);

  // Muted hover preview for direct videos (desktop only)
  useEffect(() => {
    if (isMobile || provider !== "direct" || isPlaying) return;

    const previewVideo = previewVideoRef.current;
    if (!previewVideo) return;

    if (isHovered) {
      previewVideo.currentTime = 1;
      previewVideo.play().catch(() => {});
    } else {
      previewVideo.pause();
      previewVideo.currentTime = 0;
    }
  }, [isHovered, isPlaying, provider, isMobile]);

  if (!url) return null;

  // Once clicked — render the full video player
  if (isPlaying) {
    if (provider === "direct") {
      return (
        <VideoPlayer
          url={url}
          title={title}
          onTheatreToggle={onTheatreToggle}
          isTheatreMode={isTheatreMode}
        />
      );
    }

    const embedUrl = getEmbedUrl(url, provider, true);
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden bg-black transition-all duration-300 rounded-xl border border-border/10 shadow-2xl",
          isTheatreMode ? "aspect-[21/9]" : "aspect-video"
        )}
      >
        {embedUrl && (
          <iframe
            src={embedUrl}
            title={title || "Embedded video"}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
        {onTheatreToggle && (
          <button
            onClick={onTheatreToggle}
            className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/85 text-white/90 px-3 py-1.5 font-mono text-[10px] rounded uppercase border border-white/10 transition-colors"
          >
            {isTheatreMode ? "Default" : "Theatre"}
          </button>
        )}
      </div>
    );
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  let thumbnailUrl = "";
  if (provider === "youtube") {
    const videoId = url.includes("youtube.com/watch")
      ? new URL(url).searchParams.get("v")
      : url.split("youtu.be/")[1]?.split(/[?&]/)[0];
    thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } else if (provider === "vimeo") {
    thumbnailUrl = vimeoThumbnail || "";
  }

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!isNaN(e.currentTarget.duration)) {
      setDuration(e.currentTarget.duration);
    }
  };

  return (
    <div
      className="group relative aspect-video w-full overflow-hidden rounded-xl border border-border/40 bg-muted/30 shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsPlaying(true)}
      role="button"
      tabIndex={0}
      aria-label={`Play video${title ? `: ${title}` : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsPlaying(true);
        }
      }}
    >
      {/* Thumbnail / Hover Preview */}
      {provider === "direct" ? (
        <video
          ref={previewVideoRef}
          src={url}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={title || "Video thumbnail"}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )
      )}

      {/* Dim overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 transition-opacity duration-300 group-hover:from-black/40" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 text-foreground border border-border shadow-xl backdrop-blur-sm transition-all duration-300 scale-90 group-hover:scale-100 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
          <Play className="h-5 w-5 fill-current ml-0.5" />
        </div>
      </div>

      {/* Duration badge */}
      {duration !== null && (
        <div className="absolute bottom-3 right-3 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-white select-none backdrop-blur-sm">
          {formatDuration(duration)}
        </div>
      )}

      {/* Title overlay */}
      {title && (
        <div className="absolute bottom-3 left-3 max-w-[65%] truncate rounded bg-black/60 border border-white/10 backdrop-blur-sm px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-white select-none">
          {title}
        </div>
      )}
    </div>
  );
}
