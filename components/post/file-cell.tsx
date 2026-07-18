"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { UnifiedImage } from "./unified-image";
import { VideoCard } from "./video-card";

interface FileCellProps {
  s3Url: string;
  displayType?: "inline" | "attachment" | "gallery";
  caption?: string;
  fileType?: "image" | "video" | "audio" | "document";
  originalName?: string;
  size?: number;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
};

function formatFileSize(bytes: number) {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isPdf(url: string) {
  return url?.toLowerCase().includes(".pdf");
}

export function FileCell({
  s3Url,
  caption,
  fileType,
  originalName,
  size,
}: FileCellProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pdfExpanded, setPdfExpanded] = useState(false);

  const icon = fileType ? ICON_MAP[fileType] : <File className="h-4 w-4" />;

  // ── IMAGE ─────────────────────────────────────────────────────────────────
  if (fileType === "image") {
    return (
      <div className="my-4">
        <UnifiedImage src={s3Url} alt={caption || originalName || "Image"} />
      </div>
    );
  }

  // ── VIDEO ─────────────────────────────────────────────────────────────────
  if (fileType === "video") {
    return (
      <div className="my-4">
        <VideoCard url={s3Url} title={caption || originalName} />
      </div>
    );
  }

  // ── AUDIO ─────────────────────────────────────────────────────────────────
  if (fileType === "audio") {
    return (
      <div className="my-4 space-y-2">
        <div className="flex items-center gap-3 border border-border/60 px-4 py-3 rounded-lg bg-muted/20">
          <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <audio controls className="flex-1 h-8 min-w-0">
            <source src={s3Url} />
            Your browser does not support the audio tag.
          </audio>
        </div>
        {caption && (
          <p className="text-xs text-muted-foreground italic font-display lowercase">
            {caption}
          </p>
        )}
      </div>
    );
  }

  // ── PDF EMBEDDED PREVIEW ──────────────────────────────────────────────────
  if (isPdf(s3Url) || fileType === "document") {
    return (
      <div className="my-4 border border-border/60 rounded-lg overflow-hidden">
        {/* Attachment Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/20 border-b border-border/40">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{originalName || "Document"}</p>
              {size && (
                <p className="font-display text-[10px] uppercase text-muted-foreground">
                  {formatFileSize(size)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isPdf(s3Url) && (
              <button
                onClick={() => setPdfExpanded((e) => !e)}
                className="flex items-center gap-1.5 border border-border px-2.5 py-1 font-display text-[10px] uppercase text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                aria-expanded={pdfExpanded}
              >
                {pdfExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Hide Preview
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Preview
                  </>
                )}
              </button>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href={s3Url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={s3Url && (s3Url.startsWith('http') || s3Url.startsWith('https')) ? (s3Url.includes('?') ? `${s3Url}&download=` : `${s3Url}?download=`) : s3Url} download={originalName}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </a>
            </Button>
          </div>
        </div>

        {/* Embedded PDF preview */}
        {isPdf(s3Url) && pdfExpanded && (
          <div className="w-full bg-muted/10">
            <iframe
              src={`${s3Url}#toolbar=0`}
              className="w-full"
              style={{ height: "600px" }}
              title={originalName || "PDF Document"}
            />
          </div>
        )}

        {caption && (
          <div className="px-4 py-2 border-t border-border/30 bg-muted/10">
            <p className="text-xs text-muted-foreground italic">{caption}</p>
          </div>
        )}
      </div>
    );
  }

  // ── GENERIC ATTACHMENT ────────────────────────────────────────────────────
  return (
    <div className="my-4 flex items-center justify-between gap-3 border border-border/60 px-4 py-3 rounded-lg bg-muted/10">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-muted-foreground flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{originalName || "File"}</p>
          <div className="flex items-center gap-2 font-display text-[10px] uppercase text-muted-foreground">
            {size && <span>{formatFileSize(size)}</span>}
            {fileType && <span>{fileType}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="outline" size="sm" asChild>
          <a href={s3Url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={s3Url && (s3Url.startsWith('http') || s3Url.startsWith('https')) ? (s3Url.includes('?') ? `${s3Url}&download=` : `${s3Url}?download=`) : s3Url} download={originalName}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download
          </a>
        </Button>
      </div>
    </div>
  );
}
