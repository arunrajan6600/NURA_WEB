"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VideoCard } from "./video-card";
import { cn } from "@/lib/utils";

interface VideoItem {
  id: string;
  url: string;
  title: string;
  provider?: "youtube" | "vimeo" | "direct";
}

interface VideoCollectionProps {
  videos: VideoItem[];
}

export function VideoCollection({ videos }: VideoCollectionProps) {
  // theatreIndex: null = no theatre mode, N = video N is active in theatre
  const [theatreIndex, setTheatreIndex] = useState<number | null>(null);

  const isTheatreMode = theatreIndex !== null;
  const hasMultiple = videos.length > 1;

  const handlePrev = useCallback(() => {
    setTheatreIndex((prev) => {
      if (prev === null) return 0;
      return (prev - 1 + videos.length) % videos.length;
    });
  }, [videos.length]);

  const handleNext = useCallback(() => {
    setTheatreIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % videos.length;
    });
  }, [videos.length]);

  const exitTheatre = useCallback(() => setTheatreIndex(null), []);

  if (!videos || videos.length === 0) return null;

  // Single video: full VideoCard -> VideoPlayer pipeline
  if (videos.length === 1) {
    const video = videos[0];
    return (
      <div className="w-full space-y-2">
        <VideoCard
          url={video.url}
          title={video.title}
          onTheatreToggle={() => setTheatreIndex(theatreIndex === 0 ? null : 0)}
          isTheatreMode={theatreIndex === 0}
        />
        {video.title && (
          <p className="text-xs text-muted-foreground font-meta uppercase tracking-wide px-0.5">
            {video.title}
          </p>
        )}
      </div>
    );
  }

  // Multiple videos - Theatre Mode is the ONLY playback path
  if (isTheatreMode) {
    const activeVideo = videos[theatreIndex!];
    return (
      <div className="w-full space-y-4">
        {/* Full-width active video - the ONE player for this collection */}
        <div className="relative">
          <VideoCard
            key={`theatre-${activeVideo.id}`}
            url={activeVideo.url}
            title={activeVideo.title}
            onTheatreToggle={exitTheatre}
            isTheatreMode={true}
          />
        </div>

        {/* Playlist navigator */}
        <div className="flex items-center justify-between gap-4 font-mono text-xs uppercase text-muted-foreground">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1.5 border border-border px-3 py-1.5 hover:text-foreground hover:border-foreground/40 transition-colors"
            aria-label="Previous video"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          <span className="font-counter text-xl text-foreground/70">
            Video {theatreIndex! + 1} of {videos.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 border border-border px-3 py-1.5 hover:text-foreground hover:border-foreground/40 transition-colors"
            aria-label="Next video"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Thumbnail strip - click switches active video, not a player */}
        <div
          className={cn(
            "grid gap-3",
            videos.length === 2
              ? "grid-cols-2"
              : videos.length === 3
              ? "grid-cols-3"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          )}
        >
          {videos.map((video, idx) => (
            <button
              key={video.id}
              onClick={() => setTheatreIndex(idx)}
              className={cn(
                "relative aspect-video w-full overflow-hidden rounded-lg border transition-all duration-200",
                idx === theatreIndex
                  ? "border-primary shadow-md ring-2 ring-primary/40"
                  : "border-border/40 opacity-60 hover:opacity-80 hover:border-border"
              )}
              aria-label={`Switch to video ${idx + 1}: ${video.title || ""}`}
            >
              {/* Native <video> as thumbnail frame only - not a player */}
              {!video.url.includes("youtube.com") &&
              !video.url.includes("youtu.be") &&
              !video.url.includes("vimeo.com") ? (
                <video
                  src={video.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover pointer-events-none"
                  tabIndex={-1}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-meta text-[9px] uppercase">
                  Video {idx + 1}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 pointer-events-none" />
              <div className="absolute bottom-1 left-1 font-counter text-base text-white/80 leading-none">
                {idx + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Grid view (no video playing yet)
  // VideoCards are click-targets that activate theatre mode.
  // Clicking sets theatreIndex, causing this component to switch to theatre branch.
  // This guarantees only ONE VideoPlayer is ever mounted at a time.
  return (
    <div className="w-full space-y-3">
      {hasMultiple && (
        <div className="flex items-center gap-3 font-meta text-[10px] uppercase text-muted-foreground">
          <div className="h-px flex-1 bg-border/50" />
          <span>{videos.length} videos</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>
      )}

      <div
        className={cn(
          "grid gap-4",
          videos.length === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {videos.map((video, idx) => (
          <div key={video.id} className="flex flex-col gap-2">
            <VideoCard
              key={video.id}
              url={video.url}
              title={video.title}
              onPlayClick={() => setTheatreIndex(idx)}
              onTheatreToggle={() => setTheatreIndex(idx)}
              isTheatreMode={false}
            />
            {video.title && (
              <p className="text-[10px] text-muted-foreground font-meta uppercase tracking-wide px-0.5 truncate">
                {video.title}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
