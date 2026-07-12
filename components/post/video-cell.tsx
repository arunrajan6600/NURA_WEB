"use client";

import { VideoContent } from "@/types/post";
import { useRef, useEffect, useCallback, useState } from "react";
import { PictureInPicture } from "lucide-react";

interface VideoCellProps {
  content: VideoContent;
}

export function VideoCell({ content }: VideoCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const storageKey = useRef<string>("");
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedTime, setSavedTime] = useState(0);
  const { url, title, provider = getVideoProvider(url) } = content || {};
  const aspectRatio = "16/9";

  // Only save/restore for direct video elements (not iframes)
  useEffect(() => {
    if (provider !== "direct" || !url) return;
    storageKey.current = `nuraweb-video-${btoa(url).slice(0, 32)}`;
    const stored = parseFloat(localStorage.getItem(storageKey.current) || "0");
    if (stored > 5) {
      setSavedTime(stored);
      setShowResumePrompt(true);
    }
  }, [url, provider]);

  // Periodically save playback time
  useEffect(() => {
    if (provider !== "direct") return;
    const vid = videoRef.current;
    if (!vid) return;

    const saveTime = () => {
      if (vid.currentTime > 5 && storageKey.current) {
        localStorage.setItem(storageKey.current, String(Math.floor(vid.currentTime)));
      }
    };

    vid.addEventListener("timeupdate", saveTime);
    return () => vid.removeEventListener("timeupdate", saveTime);
  }, [provider]);

  const handleResume = useCallback(() => {
    const vid = videoRef.current;
    if (vid && savedTime > 0) {
      vid.currentTime = savedTime;
      vid.play().catch(() => {});
    }
    setShowResumePrompt(false);
  }, [savedTime]);

  const handleDismissResume = useCallback(() => {
    setShowResumePrompt(false);
    // Clear the saved time so it doesn't prompt again
    if (storageKey.current) {
      localStorage.removeItem(storageKey.current);
    }
  }, []);

  const handlePiP = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await vid.requestPictureInPicture();
      }
    } catch {
      // PiP not supported or denied — silently fail
    }
  }, []);

  if (!url) return null;

  const embedUrl = provider === "direct" ? null : getEmbedUrl(url, provider);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full space-y-2">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-muted"
        style={{ aspectRatio }}
      >
        {provider === "direct" ? (
          <>
            {/* Resume prompt */}
            {showResumePrompt && (
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-background/95 backdrop-blur-sm px-3 py-2 font-mono text-xs">
                <span className="text-foreground/80">
                  Resume from <strong>{formatTime(savedTime)}</strong>?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResume}
                    className="border border-primary px-2 py-0.5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors uppercase text-[10px]"
                  >
                    Resume
                  </button>
                  <button
                    onClick={handleDismissResume}
                    className="border border-border px-2 py-0.5 text-muted-foreground hover:text-foreground transition-colors uppercase text-[10px]"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              src={url}
              title={title}
              className="absolute inset-0 h-full w-full object-contain"
              controls
              preload="metadata"
            />

            {/* PiP button overlay */}
            {typeof document !== "undefined" && "pictureInPictureEnabled" in document && (
              <button
                onClick={handlePiP}
                className="absolute bottom-10 right-3 z-10 flex h-7 w-7 items-center justify-center border border-white/20 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                aria-label="Toggle picture-in-picture"
                title="Picture in Picture"
              >
                <PictureInPicture className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          embedUrl && (
            <iframe
              src={embedUrl}
              title={title}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          )
        )}
      </div>

      {title && (
        <p className="text-xs text-muted-foreground font-mono uppercase">
          {title}
        </p>
      )}
    </div>
  );
}

function getVideoProvider(url: string): "youtube" | "vimeo" | "direct" {
  if (!url || typeof url !== "string") return "direct";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  return "direct";
}

function getEmbedUrl(url: string, provider: "youtube" | "vimeo" | "direct"): string {
  if (provider === "youtube") {
    const videoId = url.includes("youtube.com/watch")
      ? new URL(url).searchParams.get("v")
      : url.split("youtu.be/")[1]?.split(/[?&]/)[0];
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  }
  if (provider === "vimeo") {
    const videoId = url.split("vimeo.com/")[1]?.split(/[?&]/)[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
}
