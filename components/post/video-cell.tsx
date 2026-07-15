"use client";

import { VideoContent } from "@/types/post";
import { VideoCard } from "./video-card";

interface VideoCellProps {
  content: VideoContent;
}

export function VideoCell({ content }: VideoCellProps) {
  const { url, title } = content || {};
  if (!url) return null;
  return (
    <div className="w-full">
      <VideoCard url={url} title={title} />
    </div>
  );
}
