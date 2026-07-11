"use client";

import { VideoContent } from "@/types/post";
import { useRef } from "react";

interface VideoCellProps {
  content: VideoContent;
}

export function VideoCell({ content }: VideoCellProps) {
  const videoRef = useRef<HTMLIFrameElement | HTMLVideoElement>(null);
  const { url, title, provider = getVideoProvider(url) } = content || {};
  const aspectRatio = "16/9";

  // Ensure we have a valid URL
  if (!url) {
    return null;
  }

  // Extract video ID and embed URL for iframe-based providers
  const embedUrl = provider === "direct" ? null : getEmbedUrl(url, provider);

  return (
    <div className="w-full space-y-2">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-muted"
        style={{ aspectRatio }}
      >
        {provider === "direct" ? (
          <video
            ref={videoRef as React.RefObject<HTMLVideoElement>}
            src={url}
            title={title}
            className="absolute inset-0 h-full w-full object-contain"
            controls
            preload="metadata"
          />
        ) : (
          embedUrl && (
            <iframe
              ref={videoRef as React.RefObject<HTMLIFrameElement>}
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
      {title && <p className="text-sm text-muted-foreground">{title}</p>}
    </div>
  );
}

// Helper function to determine video provider from URL
function getVideoProvider(url: string): "youtube" | "vimeo" | "direct" {
  if (!url || typeof url !== "string") {
    return "direct";
  }
  
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  } else if (url.includes("vimeo.com")) {
    return "vimeo";
  } else {
    return "direct";
  }
}

// Helper function to convert standard URLs to embed URLs
function getEmbedUrl(
  url: string,
  provider: "youtube" | "vimeo" | "direct"
): string {
  if (provider === "youtube") {
    // Handle both youtube.com/watch?v=ID and youtu.be/ID formats
    const videoId = url.includes("youtube.com/watch")
      ? new URL(url).searchParams.get("v")
      : url.split("youtu.be/")[1]?.split(/[?&]/)[0];

    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } else if (provider === "vimeo") {
    const videoId = url.split("vimeo.com/")[1]?.split(/[?&]/)[0];
    return `https://player.vimeo.com/video/${videoId}`;
  } else {
    // For direct video URLs, return as is
    return url;
  }
}
