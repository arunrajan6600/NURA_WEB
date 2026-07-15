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
  const [theatreIndex, setTheatreIndex] = useState<number | null>(null);
  const [playlistActive, setPlaylistActive] = useState(false);
  const [playlistIndex, setPlaylistIndex] = useState(0);

  const isTheatreMode = theatreIndex !== null;
  const hasMultiple = videos.length > 1;

  const handleTheatreToggle = useCallback(
    (idx: number) => {
      if (theatreIndex === idx) {
        setTheatreIndex(null);
      } else {
        setTheatreIndex(idx);
        setPlaylistActive(true);
        setPlaylistIndex(idx);
      }
    },
    [theatreIndex]
  );

  const handlePrev = useCallback(() => {
    setPlaylistIndex((prev) => {
      const next = (prev - 1 + videos.length) % videos.length;
      setTheatreIndex(next);
      return next;
    });
  }, [videos.length]);

  const handleNext = useCallback(() => {
    setPlaylistIndex((prev) => {
      const next = (prev + 1) % videos.length;
      setTheatreIndex(next);
      return next;
    });
  }, [videos.length]);

  if (!videos || videos.length === 0) return null;

  // Single video
  if (videos.length === 1) {
    const video = videos[0];
    return (
      <div className="w-full space-y-2">
        <VideoCard
          url={video.url}
          title={video.title}
          onTheatreToggle={() => handleTheatreToggle(0)}
          isTheatreMode={theatreIndex === 0}
        />
        {video.title && (
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide px-0.5">
            {video.title}
          </p>
        )}
      </div>
    );
  }

  // Multiple videos — Theatre Mode playlist view
  if (isTheatreMode && playlistActive) {
    const activeVideo = videos[playlistIndex];
    return (
      <div className="w-full space-y-4">
        {/* Theatre player */}
        <div className="relative">
          <VideoCard
            url={activeVideo.url}
            title={activeVideo.title}
            onTheatreToggle={() => setTheatreIndex(null)}
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

          <span className="text-foreground/70">
            Video {playlistIndex + 1} of {videos.length}
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

        {/* Thumbnail strip */}
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
              onClick={() => {
                setPlaylistIndex(idx);
                setTheatreIndex(idx);
              }}
              className={cn(
                "relative aspect-video w-full overflow-hidden rounded-lg border transition-all duration-200",
                idx === playlistIndex
                  ? "border-primary shadow-md ring-2 ring-primary/40"
                  : "border-border/40 opacity-60 hover:opacity-80 hover:border-border"
              )}
              aria-label={`Play video ${idx + 1}: ${video.title || ""}`}
            >
              {/* Only direct-upload videos (S3, local) get a video thumbnail; embeds get a text label */}
              {!video.url.includes("youtube.com") &&
              !video.url.includes("youtu.be") &&
              !video.url.includes("vimeo.com") ? (
                <video
                  src={video.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-mono text-[9px] uppercase">
                  Video {idx + 1}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-1 left-1 font-mono text-[8px] uppercase text-white/80">
                {idx + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Normal responsive grid view
  return (
    <div className="w-full space-y-3">
      {/* Video count header */}
      {hasMultiple && (
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase text-muted-foreground">
          <div className="h-px flex-1 bg-border/50" />
          <span>{videos.length} videos</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>
      )}

      {/* Responsive grid */}
      <div
        className={cn(
          "grid gap-4",
          videos.length === 1
            ? "grid-cols-1"
            : videos.length === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {videos.map((video, idx) => (
          <div key={video.id} className="flex flex-col gap-2">
            <VideoCard
              url={video.url}
              title={video.title}
              onTheatreToggle={() => handleTheatreToggle(idx)}
              isTheatreMode={theatreIndex === idx}
            />
            {video.title && (
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide px-0.5 truncate">
                {video.title}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
